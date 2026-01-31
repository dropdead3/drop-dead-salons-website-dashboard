

# Advanced Platform Operations Suite

This comprehensive plan implements **5 advanced platform features** that transform the Platform Admin hub into a full-featured operations center with audit trails, job monitoring, feature management, alerting, and system health visibility.

---

## Feature Overview

| # | Feature | Location | Priority |
|---|---------|----------|----------|
| 1 | Audit Log Explorer | New page + sidebar link | High |
| 2 | Scheduled Jobs Dashboard | New page + sidebar link | High |
| 3 | Organization Feature Flags | Account Detail + Settings | Medium |
| 4 | Platform Notifications Center | New page + real-time alerts | Medium |
| 5 | System Health Dashboard | Overview page enhancement | High |

---

## Feature 1: Audit Log Explorer

### What Gets Built
A comprehensive audit trail viewer with advanced filtering, search, export, and drill-down capabilities.

### New Page
`/dashboard/platform/audit-log` - Full-page explorer

### Components to Create
- `PlatformAuditLogPage.tsx` - Main page component
- `AuditLogFilters.tsx` - Filter panel (date range, action type, user, org)
- `AuditLogTable.tsx` - Paginated data table
- `AuditLogDetailSheet.tsx` - Slide-over with full JSON details

### Visual Design
```text
+--------------------------------------------------------------------+
| Audit Log Explorer                        [Export CSV] [Export JSON]|
+--------------------------------------------------------------------+
| FILTERS                                                             |
| Date: [Last 7 Days ▼]  Action: [All ▼]  Org: [All ▼]  User: [All ▼]|
| Search: [_________________________________] [Apply Filters]         |
+--------------------------------------------------------------------+
| ACTION          | USER          | ORG           | TIME       | ▶   |
| ────────────────|───────────────|───────────────|────────────|─────|
| ● account_created | John Smith   | Salon A       | 2h ago     | › |
| ● migration_started| Jane Doe    | Salon B       | 3h ago     | › |
| ○ settings_updated | System      | Platform      | 5h ago     | › |
+--------------------------------------------------------------------+
| Showing 1-50 of 234 entries              [< Previous] [1] [2] [Next >]|
+--------------------------------------------------------------------+
```

### Hook Enhancement
Extend `usePlatformAuditLog`:
```typescript
interface AuditLogFilters {
  dateFrom?: Date;
  dateTo?: Date;
  actions?: string[];
  organizationId?: string;
  userId?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}

function usePlatformAuditLogExplorer(filters: AuditLogFilters)
```

### Export Functionality
```typescript
// CSV/JSON export via client-side generation
function exportAuditLogs(logs: AuditLogEntry[], format: 'csv' | 'json')
```

---

## Feature 2: Scheduled Jobs Dashboard

### What Gets Built
A monitoring dashboard for all edge functions with execution history, error tracking, and manual triggers.

### New Page
`/dashboard/platform/jobs` - Jobs dashboard

### Database Schema
```sql
-- Track edge function executions
CREATE TABLE IF NOT EXISTS public.edge_function_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error', 'timeout')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  organization_id UUID REFERENCES organizations(id),
  triggered_by TEXT DEFAULT 'cron' -- 'cron', 'manual', 'webhook'
);

-- Enable RLS
ALTER TABLE public.edge_function_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view function logs"
ON public.edge_function_logs FOR SELECT TO authenticated
USING (public.is_platform_user(auth.uid()));

-- Index for efficient querying
CREATE INDEX idx_edge_function_logs_name_started 
ON public.edge_function_logs(function_name, started_at DESC);
```

### Components to Create
- `PlatformJobsPage.tsx` - Main dashboard
- `JobCard.tsx` - Individual job with status, last run, error rate
- `JobExecutionHistory.tsx` - Timeline of recent executions
- `ManualJobTrigger.tsx` - Button + confirmation for manual runs

### Edge Function Categories
```typescript
const JOB_CATEGORIES = {
  'sync': {
    label: 'Data Sync',
    color: 'blue',
    functions: [
      'sync-phorest-data',
      'sync-phorest-services',
      'sync-callrail-calls',
    ],
  },
  'notifications': {
    label: 'Notifications',
    color: 'violet',
    functions: [
      'send-daily-reminders',
      'send-birthday-reminders',
      'check-lead-sla',
      'send-inactivity-alerts',
    ],
  },
  'snapshots': {
    label: 'Snapshots & Reports',
    color: 'emerald',
    functions: [
      'record-staffing-snapshot',
      'update-sales-leaderboard',
    ],
  },
  'maintenance': {
    label: 'Maintenance',
    color: 'amber',
    functions: [
      'check-expired-assignments',
      'cleanup-stale-sessions',
    ],
  },
};
```

### Visual Design
```text
+--------------------------------------------------------------------+
| Scheduled Jobs                                  [Pause All] [Refresh]|
+--------------------------------------------------------------------+
| CATEGORY: [All ▼]  STATUS: [All ▼]  Last 24h: 142 runs, 3 errors   |
+--------------------------------------------------------------------+
| DATA SYNC                                                           |
| ┌─────────────────────────────────────────────────────────────────┐ |
| │ sync-phorest-data                    ● Running (2m ago)         │ |
| │ Every 15 minutes                     Success rate: 98.5%        │ |
| │ Last: 12:45 PM (success)             [View History] [Run Now]   │ |
| └─────────────────────────────────────────────────────────────────┘ |
| ┌─────────────────────────────────────────────────────────────────┐ |
| │ sync-phorest-services                ○ Idle                      │ |
| │ Daily at 6:00 AM                     Success rate: 100%         │ |
| │ Last: Jan 31 6:00 AM (success)       [View History] [Run Now]   │ |
| └─────────────────────────────────────────────────────────────────┘ |
+--------------------------------------------------------------------+
```

### Manual Trigger Edge Function
```typescript
// supabase/functions/trigger-scheduled-job/index.ts
// Allows platform admins to manually invoke any registered job
```

---

## Feature 3: Organization Feature Flags

### What Gets Built
Per-organization feature toggle system that extends the existing `feature_flags` table with org-level overrides.

### Database Schema
```sql
-- Organization-specific feature flag overrides
CREATE TABLE IF NOT EXISTS public.organization_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL,
  override_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, flag_key)
);

ALTER TABLE public.organization_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage org feature flags"
ON public.organization_feature_flags FOR ALL TO authenticated
USING (public.is_platform_user(auth.uid()))
WITH CHECK (public.is_platform_user(auth.uid()));
```

### Components to Create
- `AccountFeatureFlagsTab.tsx` - Tab in AccountDetail page
- `OrgFeatureFlagRow.tsx` - Toggle with override status
- `FeatureFlagOverrideDialog.tsx` - Add reason for override

### Hook to Create
```typescript
// useOrganizationFeatureFlags.ts
function useOrganizationFeatureFlags(organizationId: string) {
  // Fetches global flags + org-specific overrides
  // Returns merged result with override indicators
}

function useUpdateOrgFeatureFlag() {
  // Creates/updates org-level override
}
```

### Visual Design
```text
+------------------------------------------------------------+
| Feature Flags for Salon A                                   |
+------------------------------------------------------------+
| ✓ = Enabled   ○ = Disabled   ⚡ = Override active           |
+------------------------------------------------------------+
| FLAG                    | GLOBAL | THIS ORG | OVERRIDE      |
| ────────────────────────|────────|──────────|───────────────|
| enable_75_hard          | ✓      | ✓        | -             |
| enable_client_portal    | ○      | ✓ ⚡     | Beta tester   |
| enable_online_booking   | ○      | ○        | -             |
| enable_inventory        | ✓      | ○ ⚡     | Not ready     |
+------------------------------------------------------------+
|                               [+ Add Override] [Reset All]  |
+------------------------------------------------------------+
```

---

## Feature 4: Platform Notifications Center

### What Gets Built
A centralized notification management system for platform-level events with multi-channel delivery.

### Database Schema
```sql
-- Platform-level notifications for admins
CREATE TABLE IF NOT EXISTS public.platform_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES auth.users(id), -- null = all platform users
  type TEXT NOT NULL, -- 'sync_failure', 'new_account', 'critical_error', 'sla_breach'
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Platform notification preferences
CREATE TABLE IF NOT EXISTS public.platform_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  slack_enabled BOOLEAN DEFAULT false,
  UNIQUE(user_id, notification_type)
);

-- RLS
ALTER TABLE public.platform_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform users see their notifications"
ON public.platform_notifications FOR SELECT TO authenticated
USING (
  public.is_platform_user(auth.uid()) 
  AND (recipient_id IS NULL OR recipient_id = auth.uid())
);

CREATE POLICY "Users manage their preferences"
ON public.platform_notification_preferences FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### Components to Create
- `PlatformNotificationsPage.tsx` - Full notification center
- `PlatformNotificationBell.tsx` - Header bell with badge
- `PlatformNotificationPanel.tsx` - Slide-over quick view
- `PlatformNotificationPreferences.tsx` - Settings panel

### Notification Types
```typescript
const PLATFORM_NOTIFICATION_TYPES = {
  sync_failure: {
    label: 'Sync Failures',
    description: 'When data syncs fail',
    defaultChannels: ['in_app', 'email'],
    icon: AlertCircle,
    color: 'rose',
  },
  new_account: {
    label: 'New Accounts',
    description: 'When new organizations are created',
    defaultChannels: ['in_app'],
    icon: Building2,
    color: 'emerald',
  },
  critical_error: {
    label: 'Critical Errors',
    description: 'System errors requiring attention',
    defaultChannels: ['in_app', 'email', 'slack'],
    icon: AlertTriangle,
    color: 'rose',
  },
  sla_breach: {
    label: 'SLA Breaches',
    description: 'When response SLAs are exceeded',
    defaultChannels: ['in_app', 'email'],
    icon: Clock,
    color: 'amber',
  },
  migration_complete: {
    label: 'Migration Complete',
    description: 'When data imports finish',
    defaultChannels: ['in_app'],
    icon: CheckCircle,
    color: 'emerald',
  },
};
```

### Visual Design - Bell + Panel
```text
+------------------------------------+
| 🔔 (3)                             |
+------------------------------------+
         ↓
+------------------------------------+
| Notifications                  ●   |
+------------------------------------+
| ⚠ sync-phorest-data failed         |
| Salon A • 5 minutes ago            |
+------------------------------------+
| ✓ New account created              |
| Salon B onboarded • 1 hour ago     |
+------------------------------------+
| 🚨 Critical: Database connection   |
| Platform • 2 hours ago             |
+------------------------------------+
| [View All Notifications]           |
+------------------------------------+
```

### Slack Integration (Optional)
```typescript
// Edge function: send-platform-slack-notification
// Uses Slack webhook for critical alerts
```

---

## Feature 5: System Health Dashboard

### What Gets Built
A real-time system health overview integrated into the Platform Overview page showing API health, sync status, and queue depths.

### Components to Create
- `SystemHealthCard.tsx` - Overview card for Platform Overview
- `SystemHealthPage.tsx` - Full detailed health page
- `HealthStatusIndicator.tsx` - Dot + label component
- `ServiceHealthRow.tsx` - Individual service status

### Health Metrics to Track
```typescript
interface SystemHealth {
  api: {
    supabase: 'healthy' | 'degraded' | 'down';
    phorest: 'healthy' | 'degraded' | 'down';
    resend: 'healthy' | 'degraded' | 'down';
    callrail: 'healthy' | 'degraded' | 'down';
  };
  sync: {
    lastPhorestSync: Date | null;
    phorestSyncStatus: 'success' | 'running' | 'failed';
    pendingSyncJobs: number;
  };
  queues: {
    pendingImports: number;
    pendingEmails: number;
    failedJobs: number;
  };
  database: {
    connectionPool: number; // percentage used
    activeQueries: number;
  };
}
```

### Edge Function for Health Check
```typescript
// supabase/functions/check-system-health/index.ts
// Pings external services, checks sync status
// Returns aggregated health status
// Called every 5 minutes via cron
```

### Visual Design - Overview Card
```text
+------------------------------------------------------------+
| System Health                              [View Details]   |
+------------------------------------------------------------+
| SERVICES                                                    |
| ● Supabase      Healthy    ● Phorest      Healthy          |
| ● Resend        Healthy    ● CallRail     Degraded ⚠       |
+------------------------------------------------------------+
| SYNC STATUS                                                 |
| Last Phorest sync: 12 minutes ago (success)                 |
| Pending jobs: 2                                             |
+------------------------------------------------------------+
| QUEUES                                                      |
| Imports: 0       Emails: 3       Failed: 1 ⚠               |
+------------------------------------------------------------+
```

### Visual Design - Full Health Page
```text
+--------------------------------------------------------------------+
| System Health Dashboard                         ● All Systems Go    |
+--------------------------------------------------------------------+
| EXTERNAL SERVICES                          Last checked: 2m ago    |
| ┌──────────────────────────────────────────────────────────────┐   |
| │ Supabase Database     ● Healthy     Response: 45ms          │   |
| │ Phorest API           ● Healthy     Response: 234ms         │   |
| │ Resend Email          ● Healthy     Response: 89ms          │   |
| │ CallRail API          ○ Degraded    Response: 2450ms ⚠      │   |
| │ Google Business       ● Healthy     Response: 156ms         │   |
| └──────────────────────────────────────────────────────────────┘   |
+--------------------------------------------------------------------+
| SYNC STATUS                                                        |
| ┌──────────────────────────────────────────────────────────────┐   |
| │ Last Phorest Sync      12 minutes ago     ● Success          │   |
| │ Last CallRail Sync     45 minutes ago     ○ Warning          │   |
| │ Pending Sync Jobs      2                                     │   |
| └──────────────────────────────────────────────────────────────┘   |
+--------------------------------------------------------------------+
| 24-HOUR METRICS                                                    |
| [Chart: Uptime timeline with green/yellow/red segments]            |
+--------------------------------------------------------------------+
```

---

## Implementation Order

### Phase 1: Data Foundation (Features 1, 2)
1. Create `edge_function_logs` table
2. Extend `usePlatformAuditLog` with filters
3. Build `PlatformAuditLogPage` with table + filters
4. Build `PlatformJobsPage` with job cards
5. Create `trigger-scheduled-job` edge function
6. Add logging to existing edge functions

### Phase 2: Feature Management (Feature 3)
1. Create `organization_feature_flags` table
2. Build `useOrganizationFeatureFlags` hook
3. Add `AccountFeatureFlagsTab` to AccountDetail
4. Connect with existing feature flag system

### Phase 3: Alerting & Monitoring (Features 4, 5)
1. Create notification tables
2. Build `PlatformNotificationBell` component
3. Add to platform header
4. Create `check-system-health` edge function
5. Build `SystemHealthCard` for Overview
6. Build full `SystemHealthPage`

---

## File Changes Summary

| File | Action | Feature |
|------|--------|---------|
| `src/pages/dashboard/platform/AuditLog.tsx` | **Create** | 1 |
| `src/components/platform/audit/AuditLogFilters.tsx` | **Create** | 1 |
| `src/components/platform/audit/AuditLogTable.tsx` | **Create** | 1 |
| `src/components/platform/audit/AuditLogDetailSheet.tsx` | **Create** | 1 |
| `src/hooks/usePlatformAuditLogExplorer.ts` | **Create** | 1 |
| `src/pages/dashboard/platform/Jobs.tsx` | **Create** | 2 |
| `src/components/platform/jobs/JobCard.tsx` | **Create** | 2 |
| `src/components/platform/jobs/JobExecutionHistory.tsx` | **Create** | 2 |
| `src/hooks/useEdgeFunctionLogs.ts` | **Create** | 2 |
| `supabase/functions/trigger-scheduled-job/index.ts` | **Create** | 2 |
| `src/components/platform/account/AccountFeatureFlagsTab.tsx` | **Create** | 3 |
| `src/hooks/useOrganizationFeatureFlags.ts` | **Create** | 3 |
| `src/pages/dashboard/platform/Notifications.tsx` | **Create** | 4 |
| `src/components/platform/layout/PlatformNotificationBell.tsx` | **Create** | 4 |
| `src/hooks/usePlatformNotifications.ts` | **Create** | 4 |
| `src/pages/dashboard/platform/SystemHealth.tsx` | **Create** | 5 |
| `src/components/platform/overview/SystemHealthCard.tsx` | **Create** | 5 |
| `supabase/functions/check-system-health/index.ts` | **Create** | 5 |
| `src/pages/dashboard/platform/Overview.tsx` | **Edit** | 5 |
| `src/components/platform/layout/PlatformSidebar.tsx` | **Edit** | 1, 2, 4, 5 |
| Database Migration | **Create** | 1, 2, 3, 4 |

---

## Database Changes

```sql
-- Feature 2: Edge function execution logs
CREATE TABLE IF NOT EXISTS public.edge_function_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error', 'timeout')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  organization_id UUID REFERENCES organizations(id),
  triggered_by TEXT DEFAULT 'cron'
);

CREATE INDEX idx_edge_function_logs_query 
ON public.edge_function_logs(function_name, started_at DESC);

-- Feature 3: Organization feature flag overrides
CREATE TABLE IF NOT EXISTS public.organization_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL,
  override_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, flag_key)
);

-- Feature 4: Platform notifications
CREATE TABLE IF NOT EXISTS public.platform_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  slack_enabled BOOLEAN DEFAULT false,
  UNIQUE(user_id, notification_type)
);

-- RLS policies for all tables
ALTER TABLE public.edge_function_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Edge function logs - platform users only
CREATE POLICY "Platform users view function logs"
ON public.edge_function_logs FOR SELECT TO authenticated
USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform admins insert logs"
ON public.edge_function_logs FOR INSERT TO authenticated
WITH CHECK (public.is_platform_user(auth.uid()));

-- Org feature flags - platform admins
CREATE POLICY "Platform admins manage org flags"
ON public.organization_feature_flags FOR ALL TO authenticated
USING (public.is_platform_user(auth.uid()))
WITH CHECK (public.is_platform_user(auth.uid()));

-- Platform notifications
CREATE POLICY "Platform users see notifications"
ON public.platform_notifications FOR SELECT TO authenticated
USING (
  public.is_platform_user(auth.uid()) 
  AND (recipient_id IS NULL OR recipient_id = auth.uid())
);

CREATE POLICY "Platform users update read status"
ON public.platform_notifications FOR UPDATE TO authenticated
USING (
  public.is_platform_user(auth.uid()) 
  AND (recipient_id IS NULL OR recipient_id = auth.uid())
);

-- Notification preferences
CREATE POLICY "Users manage notification prefs"
ON public.platform_notification_preferences FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

---

## New Sidebar Links

Add to `PlatformSidebar.tsx`:
```typescript
{ 
  label: 'Audit Log', 
  href: '/dashboard/platform/audit-log', 
  icon: FileText,
  minLevel: 2  // platform_support+
},
{ 
  label: 'Scheduled Jobs', 
  href: '/dashboard/platform/jobs', 
  icon: Clock,
  minLevel: 2
},
{ 
  label: 'System Health', 
  href: '/dashboard/platform/health', 
  icon: Activity,
  minLevel: 2
},
{ 
  label: 'Notifications', 
  href: '/dashboard/platform/notifications', 
  icon: Bell,
  minLevel: 3  // platform_admin+
},
```

---

## Technical Considerations

### Existing Patterns Used
- `usePlatformAuditLog` - Extended for explorer
- `useFeatureFlags` - Pattern for org-level flags
- Platform UI components (PlatformCard, PlatformBadge)
- Realtime subscriptions for live updates

### Performance Optimizations
- Paginated queries for audit logs (50 per page)
- Indexed queries on function_name + started_at
- Stale-while-revalidate for health checks
- Debounced filter updates

### Security Notes
- All new tables have RLS enabled
- Platform user checks via `is_platform_user()` function
- Audit log exports require admin role
- Health check endpoints are authenticated

---

## Estimated Scope

| Feature | Complexity | Estimated Lines |
|---------|------------|-----------------|
| Audit Log Explorer | High | ~600 lines |
| Scheduled Jobs Dashboard | High | ~700 lines |
| Organization Feature Flags | Medium | ~350 lines |
| Platform Notifications | High | ~550 lines |
| System Health Dashboard | Medium | ~450 lines |
| **Total** | | **~2,650 lines** |

This comprehensive suite transforms the Platform Admin hub into a true operations center with full visibility into system behavior, audit trails, and proactive alerting.

