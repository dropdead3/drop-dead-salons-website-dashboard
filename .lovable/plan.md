
# AI & Automation Enhancements - Implementation Plan

## Overview

This plan implements four AI-powered automation features to enhance scheduling efficiency, revenue prediction, client engagement, and anomaly detection. These features leverage the existing Lovable AI gateway, Supabase infrastructure, and edge functions.

---

## Feature 1: AI Scheduling Copilot

### Purpose
Provide intelligent appointment slot recommendations that optimize staff utilization, minimize gaps, and prevent double-bookings.

### Database Changes

```sql
-- Store AI scheduling suggestions for analytics
CREATE TABLE scheduling_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  staff_user_id UUID REFERENCES auth.users(id),
  suggested_date DATE NOT NULL,
  suggested_time TIME NOT NULL,
  suggestion_type TEXT NOT NULL, -- 'optimal_slot', 'fill_gap', 'avoid_conflict'
  confidence_score NUMERIC(3,2), -- 0.00 to 1.00
  context JSONB, -- surrounding appointments, reason
  was_accepted BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Track booking patterns for ML training
CREATE TABLE booking_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  location_id TEXT,
  day_of_week INTEGER, -- 0-6
  hour_of_day INTEGER, -- 0-23
  avg_bookings NUMERIC,
  peak_score NUMERIC(3,2),
  analyzed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scheduling_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_patterns ENABLE ROW LEVEL SECURITY;
```

### New Edge Function: `ai-scheduling-copilot`

```text
supabase/functions/ai-scheduling-copilot/index.ts

Purpose: Analyze staff schedules and suggest optimal appointment times

Inputs:
- staff_user_id (optional) - specific stylist or all available
- date - target date for suggestions
- service_duration_minutes - how long the service takes
- location_id - salon location

Logic:
1. Fetch existing appointments for the date
2. Identify gaps in schedule (30+ min unused slots)
3. Check historical booking patterns for peak times
4. Score each available slot by:
   - Gap filling potential (reduces fragmentation)
   - Peak hour alignment (maximize revenue)
   - Buffer time (avoid back-to-back stress)
5. Return top 3-5 suggestions with confidence scores

Output:
{
  suggestions: [
    {
      time: "10:30",
      staff_name: "Sarah",
      score: 0.92,
      reason: "Fills 45-min gap before lunch rush",
      conflicts: []
    }
  ]
}
```

### Frontend Components

| Component | Location | Description |
|-----------|----------|-------------|
| `SlotSuggestionCard` | `src/components/scheduling/SlotSuggestionCard.tsx` | Displays AI-recommended slot with accept/dismiss |
| `SchedulingCopilotPanel` | `src/components/scheduling/SchedulingCopilotPanel.tsx` | Sidebar panel in booking flow showing suggestions |
| `useSchedulingSuggestions` | `src/hooks/useSchedulingSuggestions.ts` | Hook to fetch and manage AI suggestions |

### Integration Points

- Integrate into existing `create-booking` flow
- Add "AI Suggestions" tab to scheduling calendar
- Display in AI Agent Chat when user asks "When should I book X?"

---

## Feature 2: Smart Revenue Forecasting

### Purpose
Predict daily/weekly/monthly revenue using historical trends, seasonality, and booking patterns.

### Database Changes

```sql
-- Store revenue forecasts
CREATE TABLE revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  location_id TEXT,
  forecast_date DATE NOT NULL,
  forecast_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  predicted_revenue NUMERIC NOT NULL,
  predicted_services NUMERIC,
  predicted_products NUMERIC,
  confidence_level TEXT, -- 'high', 'medium', 'low'
  factors JSONB, -- what influenced the prediction
  actual_revenue NUMERIC, -- filled after the date passes
  accuracy_score NUMERIC(5,2), -- calculated after actual is known
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, location_id, forecast_date, forecast_type)
);

ALTER TABLE revenue_forecasts ENABLE ROW LEVEL SECURITY;
```

### New Edge Function: `revenue-forecasting`

```text
supabase/functions/revenue-forecasting/index.ts

Purpose: Generate AI-powered revenue predictions

Logic:
1. Analyze last 90 days of phorest_daily_sales_summary
2. Identify patterns:
   - Day-of-week trends (Saturdays = peak)
   - Monthly seasonality (holiday spikes)
   - Staff availability correlation
3. Factor in upcoming appointments (booked revenue)
4. Apply growth/decline trends
5. Generate confidence bands (optimistic/pessimistic)

AI Prompt Strategy:
- Feed historical data + booking data to Gemini
- Ask for structured JSON predictions
- Include reasoning for transparency

Output:
{
  forecasts: [
    {
      date: "2026-02-15",
      predicted_revenue: 8500,
      confidence: "high",
      factors: ["Saturday peak", "Valentine's weekend", "3 stylists booked heavy"]
    }
  ],
  weekly_total: 42000,
  vs_last_week: "+8.5%"
}
```

### Frontend Components

| Component | Location | Description |
|-----------|----------|-------------|
| `RevenueForecastCard` | `src/components/dashboard/analytics/RevenueForecastCard.tsx` | Hero card showing predicted revenue with trend |
| `ForecastAccuracyChart` | `src/components/dashboard/analytics/ForecastAccuracyChart.tsx` | Shows how accurate past predictions were |
| `useRevenueForecast` | `src/hooks/useRevenueForecast.ts` | Fetch and display forecasts |

### Analytics Hub Integration

- Add to Sales Analytics tab
- Include in Command Center if pinned
- Show accuracy score after actuals are known

---

## Feature 3: Automated Client Follow-ups

### Purpose
Trigger intelligent post-appointment communications: thank-you messages, rebooking reminders, and at-risk client outreach.

### Database Changes

```sql
-- Client communication automation rules
CREATE TABLE client_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  rule_type TEXT NOT NULL, -- 'post_visit_thanks', 'rebooking_reminder', 'win_back'
  trigger_days INTEGER NOT NULL, -- days after last visit
  template_id UUID REFERENCES email_templates(id),
  sms_template_id UUID REFERENCES sms_templates(id),
  is_active BOOLEAN DEFAULT true,
  conditions JSONB, -- {"min_visits": 2, "service_category": "color"}
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Track automation execution
CREATE TABLE client_automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  rule_id UUID REFERENCES client_automation_rules(id),
  client_id UUID,
  sent_at TIMESTAMPTZ DEFAULT now(),
  channel TEXT, -- 'email', 'sms'
  status TEXT, -- 'sent', 'failed', 'opened', 'clicked'
  metadata JSONB
);

ALTER TABLE client_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_automation_log ENABLE ROW LEVEL SECURITY;
```

### New Edge Function: `process-client-automations`

```text
supabase/functions/process-client-automations/index.ts

Purpose: Scheduled job to process automation rules

Logic:
1. Fetch active rules per organization
2. For each rule type:
   
   POST_VISIT_THANKS (trigger_days = 1):
   - Find appointments completed yesterday
   - Send personalized thank-you with feedback link
   
   REBOOKING_REMINDER (trigger_days = 21-42):
   - Find clients whose last visit was X days ago
   - Check if they have upcoming appointments (skip if yes)
   - Send "Time to rebook?" message
   
   WIN_BACK (trigger_days = 90+):
   - Find inactive clients
   - Send special offer or "We miss you" message

3. Log all sends to client_automation_log
4. Respect unsubscribe preferences
```

### Frontend Components

| Component | Location | Description |
|-----------|----------|-------------|
| `AutomationRulesManager` | `src/components/dashboard/marketing/AutomationRulesManager.tsx` | Configure automation rules |
| `AutomationLogViewer` | `src/components/dashboard/marketing/AutomationLogViewer.tsx` | View sent automations |
| `useClientAutomations` | `src/hooks/useClientAutomations.ts` | CRUD for automation rules |

### Integration Points

- Add to Marketing Hub under "Automations" tab
- Connect to existing email_templates infrastructure
- Add metrics to Client Engine dashboard

---

## Feature 4: Anomaly Detection Alerts

### Purpose
Detect unusual patterns (sudden cancellation spikes, revenue drops, no-show increases) and alert managers in real-time.

### Database Changes

```sql
-- Anomaly detection results
CREATE TABLE detected_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  location_id TEXT,
  anomaly_type TEXT NOT NULL, -- 'revenue_drop', 'cancellation_spike', 'no_show_surge', 'booking_drop'
  severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
  detected_at TIMESTAMPTZ DEFAULT now(),
  metric_value NUMERIC,
  expected_value NUMERIC,
  deviation_percent NUMERIC,
  context JSONB,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ
);

ALTER TABLE detected_anomalies ENABLE ROW LEVEL SECURITY;
```

### New Edge Function: `detect-anomalies`

```text
supabase/functions/detect-anomalies/index.ts

Purpose: Scheduled hourly/daily job to detect anomalies

Anomaly Types:

1. REVENUE_DROP
   - Compare today's revenue to same day last week
   - Alert if >20% below expected
   
2. CANCELLATION_SPIKE
   - Track cancellation rate (cancellations / total bookings)
   - Alert if rate exceeds 2x normal average
   
3. NO_SHOW_SURGE
   - Monitor no-show rate for the day
   - Alert if >3 no-shows in a single day
   
4. BOOKING_DROP
   - Compare new bookings to trailing average
   - Alert if 30%+ below normal

Thresholds stored in organization_settings for customization

Output:
- Insert into detected_anomalies table
- Trigger push notification to managers
- Log to platform_notifications if critical
```

### Frontend Components

| Component | Location | Description |
|-----------|----------|-------------|
| `AnomalyAlertBanner` | `src/components/dashboard/AnomalyAlertBanner.tsx` | Top-of-dashboard alert for active anomalies |
| `AnomalyHistoryPanel` | `src/components/dashboard/analytics/AnomalyHistoryPanel.tsx` | View past anomalies and resolutions |
| `AnomalyThresholdSettings` | `src/components/dashboard/settings/AnomalyThresholdSettings.tsx` | Configure sensitivity |
| `useAnomalies` | `src/hooks/useAnomalies.ts` | Fetch and acknowledge anomalies |

### Integration Points

- Add to Operations Hub
- Show in Command Center for managers
- Integrate with existing push notification system (`send-push-notification`)

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. Create database tables with RLS policies
2. Implement `ai-scheduling-copilot` edge function
3. Build `useSchedulingSuggestions` hook
4. Add basic `SlotSuggestionCard` UI

### Phase 2: Revenue Intelligence (Week 3-4)
1. Implement `revenue-forecasting` edge function
2. Create `RevenueForecastCard` component
3. Add forecast accuracy tracking
4. Integrate into Sales Analytics

### Phase 3: Client Automation (Week 5-6)
1. Implement `process-client-automations` edge function
2. Build `AutomationRulesManager` UI
3. Connect to existing email/SMS templates
4. Add automation metrics

### Phase 4: Anomaly Detection (Week 7-8)
1. Implement `detect-anomalies` edge function
2. Create `AnomalyAlertBanner` component
3. Add acknowledgment workflow
4. Configure threshold settings

---

## File Changes Summary

| Category | New Files | Modified Files |
|----------|-----------|----------------|
| Edge Functions | 4 new functions | - |
| Hooks | 4 new hooks | - |
| Components | 10+ new components | `CommandCenterAnalytics.tsx`, `ScheduleCalendar.tsx` |
| Database | 5 new tables | - |

---

## Technical Notes

1. **AI Gateway**: All AI calls use Lovable AI gateway (`https://ai.gateway.lovable.dev`) with `google/gemini-3-flash-preview` model
2. **Scheduling**: Builds on existing `check-availability` and `create-booking` functions
3. **Forecasting**: Extends existing `usePayrollForecasting` pattern
4. **Notifications**: Reuses existing `send-push-notification` infrastructure
5. **Email/SMS**: Leverages existing `email_templates` and `sms_templates` tables
6. **RLS**: All new tables have organization-scoped RLS policies

---

## Success Metrics

| Feature | KPI | Target |
|---------|-----|--------|
| Scheduling Copilot | Suggestion acceptance rate | >40% |
| Revenue Forecast | Prediction accuracy (within 10%) | >75% of days |
| Client Automations | Rebooking rate from reminders | >15% |
| Anomaly Detection | False positive rate | <20% |
