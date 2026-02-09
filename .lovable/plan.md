
# Category 3-7: Remaining Enhancement Categories - Full Implementation Plan

## Status Summary

| Category | Status | Priority |
|----------|--------|----------|
| 1. AI & Automation | ✅ Complete | - |
| 2. Analytics & Reporting | ✅ Complete | - |
| 3. Mobile & UX | 🔄 To Implement | High |
| 4. Team Collaboration | 🔄 To Implement | High |
| 5. Platform Admin | 🔄 To Implement | Medium |
| 6. Quick Wins | 🔄 To Implement | High |
| 7. Technical Debt | 🔄 To Implement | Medium |

---

## Category 3: Mobile & UX Improvements

### Current State
- Basic `useIsMobile` hook exists (`src/hooks/use-mobile.tsx`)
- No dedicated mobile components or layouts
- No PWA manifest or service worker
- No offline capabilities
- Dashboard is responsive but not mobile-optimized

### Feature 3.1: Mobile-First Schedule View

**Purpose**: Provide a dedicated mobile interface for viewing and managing today's schedule.

**New Components**:

| Component | Description |
|-----------|-------------|
| `MobileScheduleView.tsx` | Optimized schedule view for mobile devices |
| `MobileAgendaCard.tsx` | Touch-friendly appointment cards |
| `SwipeableAppointment.tsx` | Swipe actions for check-in/complete/cancel |
| `MobileQuickBook.tsx` | Simplified mobile booking flow |
| `MobileClientLookup.tsx` | Quick client search with recent history |

**Technical Implementation**:
```text
src/components/mobile/
├── schedule/
│   ├── MobileScheduleView.tsx
│   ├── MobileAgendaCard.tsx
│   ├── SwipeableAppointment.tsx
│   └── MobileQuickBook.tsx
├── clients/
│   ├── MobileClientLookup.tsx
│   └── MobileClientCard.tsx
└── layout/
    ├── MobileBottomNav.tsx
    ├── MobileHeader.tsx
    └── MobilePullToRefresh.tsx
```

### Feature 3.2: PWA Quick Actions Widget

**Purpose**: Allow staff to quickly log metrics, ring the bell, or view schedule from home screen.

**Database Changes**:
```sql
-- Store PWA installation preferences
CREATE TABLE pwa_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT,
  device_type TEXT, -- 'ios', 'android', 'desktop'
  installed_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  push_enabled BOOLEAN DEFAULT false
);

ALTER TABLE pwa_installations ENABLE ROW LEVEL SECURITY;
```

**New Files**:

| File | Description |
|------|-------------|
| `public/manifest.json` | PWA manifest with shortcuts |
| `public/sw.js` | Service worker for offline caching |
| `src/hooks/usePWAInstall.ts` | Hook for install prompt and status |
| `src/components/PWAInstallPrompt.tsx` | Smart install banner |

**Manifest Configuration**:
```json
{
  "name": "Salon Dashboard",
  "short_name": "Dashboard",
  "start_url": "/dashboard",
  "display": "standalone",
  "shortcuts": [
    {
      "name": "Ring the Bell",
      "url": "/dashboard/ring-the-bell",
      "icons": [{ "src": "/icons/bell.png", "sizes": "96x96" }]
    },
    {
      "name": "Today's Schedule",
      "url": "/dashboard/schedule",
      "icons": [{ "src": "/icons/calendar.png", "sizes": "96x96" }]
    },
    {
      "name": "Log Metrics",
      "url": "/dashboard/stats",
      "icons": [{ "src": "/icons/chart.png", "sizes": "96x96" }]
    }
  ]
}
```

### Feature 3.3: Offline Mode for Today's Queue

**Purpose**: Cache today's appointments and client notes for offline access.

**Technical Implementation**:
- Use service worker to cache critical API responses
- IndexedDB storage for appointment and client data
- Sync queue for offline actions (check-in, notes)
- Visual indicator for offline status

**New Hooks**:

| Hook | Description |
|------|-------------|
| `useOfflineStatus.ts` | Detect and expose online/offline state |
| `useOfflineCache.ts` | Manage IndexedDB cache for appointments |
| `useOfflineSync.ts` | Queue and sync offline actions |

---

## Category 4: Team Collaboration Enhancements

### Current State
- Full team chat system exists (`src/components/team-chat/`)
- @mention functionality implemented (`MentionInput.tsx`, `MentionAutocomplete.tsx`)
- `account_note_mentions` table exists in database
- Notification preferences system in place
- No shared team calendar for availability

### Feature 4.1: @Mention Notifications Enhancement

**Purpose**: Extend existing mentions to trigger push/email notifications and create a unified mentions inbox.

**Database Changes**:
```sql
-- Unified mentions table for all mention types
CREATE TABLE user_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_by UUID REFERENCES auth.users(id),
  source_type TEXT NOT NULL, -- 'chat', 'note', 'task', 'announcement'
  source_id UUID NOT NULL,
  source_context TEXT, -- preview of the message
  read_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_mentions_user ON user_mentions(user_id, read_at);

ALTER TABLE user_mentions ENABLE ROW LEVEL SECURITY;
```

**Edge Function**: `process-mention-notifications`
```text
Purpose: Send push/email notifications for new mentions

Triggers: 
- INSERT on team_chat_messages with mentions
- INSERT on account_notes with mentions
- INSERT on announcement_comments with mentions

Logic:
1. Parse mention format: @[Name](userId)
2. Check user notification preferences
3. Queue push notification if enabled
4. Queue email if email_notifications_enabled
5. Insert into user_mentions table
```

**Frontend Components**:

| Component | Description |
|-----------|-------------|
| `MentionsInbox.tsx` | Unified view of all mentions |
| `MentionNotificationBadge.tsx` | Badge showing unread mention count |
| `MentionContextCard.tsx` | Preview card with source link |
| `useMentions.ts` | Hook for fetching/marking mentions |

### Feature 4.2: Shared Team Calendar

**Purpose**: Show team availability, time-off, and important dates in a shared view.

**Database Changes**:
```sql
-- Team calendar events (different from appointments)
CREATE TABLE team_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  location_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'meeting', 'training', 'time_off', 'holiday', 'special'
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,
  recurring_pattern JSONB, -- { frequency: 'weekly', days: [1,3,5] }
  visibility TEXT DEFAULT 'team', -- 'team', 'leadership', 'private'
  created_by UUID REFERENCES auth.users(id),
  attendees JSONB, -- [{ userId, status: 'confirmed'|'tentative'|'declined' }]
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE team_calendar_events ENABLE ROW LEVEL SECURITY;
```

**Frontend Components**:

| Component | Description |
|-----------|-------------|
| `TeamCalendarPage.tsx` | Full calendar view with filters |
| `TeamCalendarMini.tsx` | Widget for dashboard |
| `CalendarEventCard.tsx` | Event detail popover |
| `CreateEventDialog.tsx` | Add new team events |
| `useTeamCalendar.ts` | CRUD for calendar events |

### Feature 4.3: Daily Huddle Automation

**Purpose**: Auto-generate pre-shift team huddle agendas from analytics data.

**Edge Function**: `generate-daily-huddle`
```text
Purpose: Create daily meeting agenda from analytics

Schedule: 6 AM daily via pg_cron

Generated Content:
1. Yesterday's Highlights
   - Revenue vs goal
   - Top performer
   - Notable achievements (bells rung)
   
2. Today's Focus
   - Expected revenue
   - Key appointments
   - Birthday clients
   
3. Attention Items
   - No-shows/cancellations yesterday
   - Active anomalies
   - Low inventory alerts
   
4. Celebrations
   - Team birthdays today
   - Work anniversaries
   - Recent graduations
```

**Frontend Integration**:
- Add to existing `/dashboard/admin/daily-huddle` page
- Auto-populated sections with "AI Generated" badge
- Manual edit capability before publishing

---

## Category 5: Platform Admin Enhancements

### Current State
- Platform admin pages exist (`src/pages/dashboard/platform/`)
- Organization stats hook exists (`useOrganizationStats`)
- No organization health score
- No cross-organization benchmarking
- No tenant engagement tracking

### Feature 5.1: Organization Health Score Dashboard

**Purpose**: Calculate and display a health score for each tenant based on engagement, adoption, and performance metrics.

**Database Changes**:
```sql
-- Store computed health scores
CREATE TABLE organization_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL, -- 0-100
  score_breakdown JSONB NOT NULL,
  -- Breakdown: { adoption: 85, engagement: 72, performance: 91, data_quality: 88 }
  risk_level TEXT, -- 'healthy', 'at_risk', 'critical'
  trends JSONB, -- { score_30d_ago: 78, score_7d_ago: 82 }
  recommendations JSONB, -- AI-generated improvement suggestions
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, calculated_at::DATE)
);

ALTER TABLE organization_health_scores ENABLE ROW LEVEL SECURITY;
```

**Score Calculation Factors**:

| Factor | Weight | Metrics |
|--------|--------|---------|
| Adoption | 25% | Active users, feature utilization, login frequency |
| Engagement | 25% | Chat activity, announcements read, tasks completed |
| Performance | 30% | Revenue vs goals, KPI trends, bookings |
| Data Quality | 20% | Sync success rate, data completeness, error rate |

**Edge Function**: `calculate-health-scores`
```text
Purpose: Daily calculation of org health scores

Schedule: 5 AM daily via pg_cron

Logic:
1. For each active organization:
   a. Calculate adoption metrics (DAU/MAU, feature usage)
   b. Calculate engagement metrics (activity levels)
   c. Calculate performance metrics (business outcomes)
   d. Calculate data quality (sync health)
2. Apply weighted average for total score
3. Determine risk level thresholds
4. Generate AI recommendations for improvement
5. Store in organization_health_scores
```

**Frontend Components**:

| Component | Description |
|-----------|-------------|
| `HealthScoreDashboard.tsx` | Main platform admin view |
| `HealthScoreCard.tsx` | Individual org health card |
| `HealthScoreBreakdown.tsx` | Detailed score factors |
| `HealthTrendChart.tsx` | Score over time visualization |
| `RiskAlertsList.tsx` | At-risk organizations list |
| `useOrganizationHealth.ts` | Fetch health scores |

### Feature 5.2: Cross-Organization Benchmarking

**Purpose**: Compare organizations against each other to identify best practices and struggling accounts.

**Database Changes**:
```sql
-- Benchmark metrics per organization
CREATE TABLE organization_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  value NUMERIC NOT NULL,
  percentile INTEGER, -- 0-100, where they rank
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  comparison_group TEXT, -- 'all', 'same_size', 'same_tier'
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, metric_key, period_start, comparison_group)
);

ALTER TABLE organization_benchmarks ENABLE ROW LEVEL SECURITY;
```

**Benchmarked Metrics**:
- Revenue per location
- Appointments per staff
- Rebooking rate
- Average ticket
- Feature adoption rate
- User engagement score

**Frontend Components**:

| Component | Description |
|-----------|-------------|
| `BenchmarkComparison.tsx` | Side-by-side org comparison |
| `BenchmarkLeaderboard.tsx` | Top performers by metric |
| `PercentileIndicator.tsx` | Visual percentile ranking |

---

## Category 6: Quick Wins

### 6.1: Extend "Yesterday" View to All Analytics Cards

**Current State**: Only some cards support the "Yesterday" date filter.

**Implementation**:
- Update all analytics cards to handle `dateRange === 'yesterday'`
- Ensure queries properly filter by yesterday's date
- Display "Final" badge to indicate data is complete

**Affected Components**:
- `NewBookingsCard.tsx`
- `TodayScheduleCard.tsx`
- `RevenueOverviewCard.tsx`
- All pinnable analytics cards

### 6.2: "By Location" Breakdown for All Applicable Cards

**Current State**: Only `NewBookingsCard` has location breakdown pattern.

**Implementation**:
- Create reusable `LocationBreakdownSection` component
- Apply to: Revenue cards, Appointments cards, Operations cards
- Auto-suppress when specific location is filtered

**New Component**:
```typescript
interface LocationBreakdownSectionProps {
  data: { locationId: string; locationName: string; value: number }[];
  format: 'currency' | 'number' | 'percent';
  isAllLocations: boolean;
}
```

### 6.3: Keyboard Shortcuts Extension

**Current State**: `Cmd+K` opens search.

**Additional Shortcuts to Add**:

| Shortcut | Action |
|----------|--------|
| `g h` | Go to Home |
| `g s` | Go to Schedule |
| `g c` | Go to Chat |
| `g a` | Go to Analytics |
| `n` | New (context-sensitive) |
| `?` | Show keyboard shortcuts help |

**Implementation**:
- Extend existing keyboard handling
- Add `KeyboardShortcutsDialog.tsx` for help overlay
- Persist shortcut preferences in user settings

### 6.4: Per-Card CSV/PDF Export Buttons

**Current State**: Exports are only in Reports tab.

**Implementation**:
- Add export icon button to all analytics card headers
- Reuse existing PDF/CSV generation utilities
- Add to `PinnedAnalyticsCard.tsx` wrapper

**New Component**:
```typescript
interface CardExportButtonProps {
  cardId: string;
  data: any;
  title: string;
  dateRange: string;
}
```

---

## Category 7: Technical Debt Resolution

### 7.1: Remove Hardcoded Organization IDs

**Issue**: Some components contain hardcoded org IDs (e.g., `drop-dead-salons`).

**Files to Update**:
- `TeamChat.tsx` (line 17)
- Any other files with hardcoded UUIDs

**Solution**:
- Replace with `effectiveOrganization` from context
- Add fallback to first available organization

### 7.2: Complete Email Notification TODOs

**Issue**: Several TODO comments for email notifications.

**Implementation**:
- Connect to existing `send-email` edge function
- Implement notification queueing
- Add email templates for missing notification types

### 7.3: Reduce Phorest Table Dependency

**Issue**: Heavy reliance on `phorest_*` tables limits multi-POS support.

**Solution**:
- Create abstraction layer for POS data
- Implement adapter pattern for different POS systems
- Add `pos_appointments` and `pos_sales` views

---

## Implementation Phases

### Phase 1: Quick Wins (Week 1)
1. Extend Yesterday view to all cards
2. Add Location Breakdown to applicable cards
3. Add keyboard shortcuts
4. Per-card export buttons

### Phase 2: Mobile Foundation (Week 2-3)
1. Create PWA manifest and service worker
2. Build mobile-first schedule view
3. Implement offline caching for today's queue
4. Add PWA install prompt

### Phase 3: Collaboration (Week 4-5)
1. Enhance @mention notifications with edge function
2. Build Mentions Inbox
3. Create team calendar infrastructure
4. Implement daily huddle automation

### Phase 4: Platform Admin (Week 6-7)
1. Build health score calculation edge function
2. Create Health Score Dashboard
3. Implement cross-org benchmarking
4. Add risk alerts and recommendations

### Phase 5: Technical Debt (Week 8)
1. Remove hardcoded organization IDs
2. Complete email notification integrations
3. Create POS abstraction layer
4. Performance optimizations

---

## File Changes Summary

| Category | New Files | Modified Files |
|----------|-----------|----------------|
| Mobile & UX | 15+ components, 1 manifest, 1 service worker | `DashboardLayout.tsx` |
| Team Collaboration | 10+ components, 1 edge function | `TeamChatContext.tsx`, `MentionInput.tsx` |
| Platform Admin | 8+ components, 1 edge function | `PlatformOverview.tsx` |
| Quick Wins | 5+ components | Multiple analytics cards |
| Technical Debt | - | 10+ files |

---

## Database Tables Summary

| Table | Purpose |
|-------|---------|
| `pwa_installations` | Track PWA installs and device tokens |
| `user_mentions` | Unified mentions tracking |
| `team_calendar_events` | Shared team calendar |
| `organization_health_scores` | Tenant health tracking |
| `organization_benchmarks` | Cross-org comparison data |

---

## Success Metrics

| Feature | KPI | Target |
|---------|-----|--------|
| Mobile Schedule | Mobile session duration | +30% |
| PWA Install | Installation rate | >20% of mobile users |
| Offline Mode | Offline actions synced | 99%+ success |
| @Mentions | Mention response time | <2 hours avg |
| Health Scores | At-risk identification | 90%+ accuracy |
| Quick Wins | Feature adoption | +15% engagement |
