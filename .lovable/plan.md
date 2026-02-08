
# Phase 3: Client Engagement Tools

Build on the existing client directory and appointment system to add three key engagement features:
1. **Client Feedback/Reviews** - Post-appointment surveys with NPS tracking
2. **Loyalty Rewards Dashboard** - Client-facing view of their points, tier status, rewards
3. **Automated Re-engagement** - Trigger outreach when clients haven't visited in X days

---

## Current Infrastructure

### Existing Tables
| Table | Purpose |
|-------|---------|
| `phorest_clients` | Client data with `last_visit`, `visit_count`, `total_spend` |
| `appointments` | Appointment records with `status`, `client_id`, `staff_user_id` |
| `client_loyalty_points` | Points balance per client (`current_points`, `lifetime_points`, `tier`) |
| `loyalty_tiers` | Tier definitions (Bronze, Silver, Gold, Platinum) |
| `loyalty_program_settings` | Program configuration (points per dollar, multipliers) |
| `email_templates` | Reusable email templates with variable support |
| `service_communication_flows` | Per-service communication triggers |

### Existing Hooks & Services
- `useClientLoyaltyPoints` - Fetch client points and history
- `useLoyaltySettings` - Program configuration
- `useEmailTemplates` - Email template management
- `LoyaltyProgramConfigurator` - Admin settings UI

---

## 1. Client Feedback System

### Database Schema

```sql
-- Client feedback surveys table
CREATE TABLE client_feedback_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  trigger_type TEXT DEFAULT 'post_appointment', -- post_appointment, manual, follow_up
  delay_hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Individual feedback responses
CREATE TABLE client_feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  survey_id UUID REFERENCES client_feedback_surveys(id),
  client_id UUID REFERENCES phorest_clients(id),
  appointment_id UUID REFERENCES appointments(id),
  staff_user_id UUID,
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  service_quality INTEGER CHECK (service_quality >= 1 AND service_quality <= 5),
  staff_friendliness INTEGER CHECK (staff_friendliness >= 1 AND staff_friendliness <= 5),
  cleanliness INTEGER CHECK (cleanliness >= 1 AND cleanliness <= 5),
  would_recommend BOOLEAN,
  comments TEXT,
  is_public BOOLEAN DEFAULT false,
  responded_at TIMESTAMPTZ DEFAULT now(),
  token TEXT UNIQUE, -- For anonymous survey links
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NPS tracking aggregates (for analytics)
CREATE TABLE nps_daily_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  snapshot_date DATE NOT NULL,
  total_responses INTEGER DEFAULT 0,
  promoters INTEGER DEFAULT 0,  -- 9-10
  passives INTEGER DEFAULT 0,   -- 7-8
  detractors INTEGER DEFAULT 0, -- 0-6
  nps_score INTEGER, -- calculated: ((promoters - detractors) / total) * 100
  average_rating NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, snapshot_date)
);
```

### Edge Function: `send-feedback-request`
Triggered after appointment completion to send survey link to client.

### Frontend Components
| Component | Description |
|-----------|-------------|
| `FeedbackSurveyPage` | Public page where clients submit feedback (no login required) |
| `FeedbackDashboard` | Admin view of all responses, NPS trends, staff ratings |
| `NPSScoreCard` | Widget showing current NPS with trend indicator |
| `FeedbackResponseList` | Filterable list of recent responses |
| `StaffFeedbackReport` | Per-stylist feedback breakdown |

### Files to Create
```text
src/pages/ClientFeedback.tsx              # Public survey page
src/pages/dashboard/admin/FeedbackHub.tsx # Admin dashboard
src/components/feedback/NPSScoreCard.tsx
src/components/feedback/FeedbackResponseList.tsx
src/components/feedback/FeedbackTrends.tsx
src/hooks/useFeedbackSurveys.ts
src/hooks/useNPSAnalytics.ts
supabase/functions/send-feedback-request/index.ts
```

---

## 2. Client Loyalty Dashboard

### Purpose
A client-facing portal where clients can view their loyalty status without needing a full user account.

### Access Method
Clients access via a unique tokenized link sent after appointments or available via QR code at checkout.

### Database Additions
```sql
-- Client portal access tokens
CREATE TABLE client_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES phorest_clients(id) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Frontend Components

| Component | Description |
|-----------|-------------|
| `ClientLoyaltyPortal` | Public page showing client's rewards status |
| `ClientTierProgress` | Visual progress bar to next tier |
| `ClientPointsHistory` | Transaction history for the client |
| `ClientAvailableRewards` | Rewards they can redeem |
| `ClientRedemptionHistory` | Past redemptions |

### Portal Layout
```text
+--------------------------------------------------+
|  🎁 YOUR REWARDS                                  |
|  Welcome back, Sarah!                             |
+--------------------------------------------------+
|                                                   |
|  TIER STATUS                                      |
|  +---------------------------------------------+  |
|  | 💎 GOLD MEMBER                              |  |
|  | 1,250 points | 750 to Platinum              |  |
|  | [=================-----] 62%                |  |
|  +---------------------------------------------+  |
|                                                   |
|  AVAILABLE REWARDS                                |
|  +-------------+ +-------------+ +-------------+  |
|  | Free Blowout| | $10 Off    | | Product Set |  |
|  | 500 pts     | | 750 pts    | | 1000 pts    |  |
|  | [Redeem]    | | [Redeem]   | | [Soon!]     |  |
|  +-------------+ +-------------+ +-------------+  |
|                                                   |
|  RECENT ACTIVITY                                  |
|  • Jan 15: +50 pts (Haircut)                     |
|  • Jan 3: -500 pts (Redeemed: Free Blowout)     |
|  • Dec 28: +75 pts (Color Service)              |
+--------------------------------------------------+
```

### Files to Create
```text
src/pages/ClientPortal.tsx                    # Public loyalty portal
src/components/client-portal/TierProgressCard.tsx
src/components/client-portal/AvailableRewardsGrid.tsx
src/components/client-portal/PointsActivityFeed.tsx
src/hooks/useClientPortalData.ts
```

---

## 3. Automated Re-engagement System

### Purpose
Automatically identify clients who haven't visited in X days and trigger outreach campaigns.

### Database Schema
```sql
-- Re-engagement campaign definitions
CREATE TABLE reengagement_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  inactivity_days INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  email_template_id UUID REFERENCES email_templates(id),
  sms_enabled BOOLEAN DEFAULT false,
  offer_type TEXT, -- 'discount', 'bonus_points', 'free_addon', null
  offer_value TEXT, -- e.g., '15%', '100 points', 'Free conditioning treatment'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Track which clients have been contacted
CREATE TABLE reengagement_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES reengagement_campaigns(id),
  client_id UUID REFERENCES phorest_clients(id),
  last_visit_date TIMESTAMPTZ,
  days_inactive INTEGER,
  contacted_at TIMESTAMPTZ DEFAULT now(),
  channel TEXT, -- 'email', 'sms'
  status TEXT DEFAULT 'sent', -- sent, opened, clicked, converted, unsubscribed
  converted_at TIMESTAMPTZ,
  converted_appointment_id UUID REFERENCES appointments(id),
  UNIQUE(campaign_id, client_id)
);
```

### Edge Function: `check-client-inactivity`
Runs daily to identify at-risk clients and trigger outreach.

```text
Logic Flow:
1. Query clients where last_visit < (today - X days)
2. Exclude clients already contacted in this campaign
3. Exclude banned/unsubscribed clients
4. For each matching client:
   a. Create outreach record
   b. Send email via Resend
   c. Log result
5. Track conversions when client books again
```

### Admin UI Components

| Component | Description |
|-----------|-------------|
| `ReengagementCampaignList` | List of campaigns with stats |
| `ReengagementCampaignEditor` | Create/edit campaign settings |
| `AtRiskClientsTable` | Clients due for re-engagement |
| `ReengagementAnalytics` | Conversion rates, ROI tracking |

### Integration with Client Directory
Add visual indicators in the existing Client Directory:
- "Last contacted" badge showing recent outreach
- Quick action button to manually trigger re-engagement email
- Filter for "Pending re-engagement" status

### Files to Create
```text
src/pages/dashboard/admin/ReengagementHub.tsx
src/components/reengagement/CampaignList.tsx
src/components/reengagement/CampaignEditor.tsx
src/components/reengagement/AtRiskClientsQueue.tsx
src/components/reengagement/ConversionTracking.tsx
src/hooks/useReengagementCampaigns.ts
src/hooks/useAtRiskClients.ts
supabase/functions/check-client-inactivity/index.ts
supabase/functions/send-reengagement-email/index.ts
```

---

## Implementation Order

| Phase | Feature | Effort |
|-------|---------|--------|
| 3.1 | Client Feedback System (DB + Edge Function + Survey Page) | Medium |
| 3.2 | Feedback Dashboard (Admin analytics + NPS tracking) | Medium |
| 3.3 | Client Loyalty Portal (Public page + token system) | Medium |
| 3.4 | Re-engagement Campaigns (DB + Admin UI) | Medium |
| 3.5 | Automated Outreach (Edge functions + cron) | Medium |
| 3.6 | Conversion Tracking & Analytics | Low |

---

## Technical Notes

### Email Templates Required
Create new email templates for:
1. `feedback_request` - Post-appointment survey invitation
2. `client_portal_access` - Link to loyalty portal
3. `reengagement_offer` - Win-back campaign email
4. `reengagement_reminder` - Follow-up if no response

### Security Considerations
- Client portal uses secure tokens (not guessable UUIDs)
- Tokens expire after 30 days by default
- Feedback surveys use one-time tokens
- RLS policies to isolate data by organization

### Existing Pattern Alignment
- Uses existing `email_templates` table for all communications
- Follows `service_communication_flows` pattern for triggers
- Integrates with `phorest_clients` for client data
- Uses `appointments` table for triggering post-visit surveys
