
# Category 5: Platform Admin Enhancements - Implementation Plan

## Executive Summary

This plan implements **Organization Health Score Dashboard** and **Cross-Organization Benchmarking** to give platform administrators visibility into tenant health, identify at-risk accounts, and compare performance across organizations.

---

## Current State Analysis

### Existing Infrastructure

| Component | Status | Location |
|-----------|--------|----------|
| Platform Overview | ✅ Complete | `Overview.tsx` with stats, growth chart, activity feed |
| Organization Stats | ✅ Basic counts | `useOrganizationStats.ts` - total orgs, locations, users |
| Account Management | ✅ Complete | `Accounts.tsx`, `AccountDetail.tsx` with tabs |
| System Health | ✅ Service monitoring | `SystemHealth.tsx` - external services, sync status |
| Stripe Health | ✅ Payment monitoring | `StripeHealth.tsx` - at-risk orgs, revenue at risk |
| Audit Log | ✅ Activity tracking | `AuditLog.tsx` - platform_audit_log table |
| Sync Tracking | ✅ Complete | `phorest_sync_log` table with status, timing |
| Anomaly Detection | ✅ Complete | `detected_anomalies` table, edge function |

### Key Data Sources Available

| Source | Data Available |
|--------|---------------|
| `organizations` | Status, onboarding stage, created_at, activated_at |
| `employee_profiles` | Active users per org |
| `team_chat_messages` | Chat activity per org |
| `announcements` | Content engagement |
| `phorest_daily_sales_summary` | Revenue, bookings, transactions |
| `phorest_sync_log` | Sync success rate, timing |
| `import_jobs` | Data import status |
| `detected_anomalies` | Unresolved issues count |
| `platform_audit_log` | Admin activity tracking |

---

## Feature 1: Organization Health Score Dashboard

### Purpose
Calculate and display a composite health score (0-100) for each organization based on adoption, engagement, performance, and data quality metrics. Enable platform admins to quickly identify at-risk accounts and prioritize support efforts.

### Database Changes

```sql
-- Store computed health scores with daily history
CREATE TABLE organization_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL, -- 0.00 to 100.00
  risk_level TEXT NOT NULL, -- 'healthy', 'at_risk', 'critical'
  score_breakdown JSONB NOT NULL,
  -- { 
  --   adoption: { score: 85, factors: { active_users: 8, login_frequency: 4.2, features_used: 12 } },
  --   engagement: { score: 72, factors: { chat_messages_7d: 45, announcements_read: 0.85, tasks_completed: 23 } },
  --   performance: { score: 91, factors: { revenue_trend: 1.12, booking_volume: 156, avg_ticket: 95 } },
  --   data_quality: { score: 88, factors: { sync_success_rate: 0.98, last_sync_hours: 2, anomalies_unresolved: 1 } }
  -- }
  trends JSONB, -- { score_7d_ago: 82, score_30d_ago: 78, trend: 'improving'|'stable'|'declining' }
  recommendations JSONB, -- AI-generated improvement suggestions
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, calculated_at::DATE) -- One score per org per day
);

CREATE INDEX idx_health_scores_org ON organization_health_scores(organization_id, calculated_at DESC);
CREATE INDEX idx_health_scores_risk ON organization_health_scores(risk_level) WHERE calculated_at > now() - interval '1 day';

ALTER TABLE organization_health_scores ENABLE ROW LEVEL SECURITY;

-- Only platform admins can view health scores
CREATE POLICY "Platform admins view health scores" ON organization_health_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM platform_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('platform_owner', 'platform_admin', 'platform_support')
    )
  );
```

### Score Calculation Algorithm

```text
HEALTH SCORE = Weighted Average of 4 Components

┌─────────────────────────────────────────────────────────────────┐
│ COMPONENT        │ WEIGHT │ FACTORS                            │
├─────────────────────────────────────────────────────────────────┤
│ Adoption (25%)   │  25%   │ • Active users / Total users       │
│                  │        │ • Avg logins per user (7d)         │
│                  │        │ • Unique features accessed (7d)    │
├─────────────────────────────────────────────────────────────────┤
│ Engagement (25%) │  25%   │ • Chat messages sent (7d)          │
│                  │        │ • Announcements viewed %           │
│                  │        │ • Tasks/checklist completion       │
├─────────────────────────────────────────────────────────────────┤
│ Performance (30%)│  30%   │ • Revenue trend (vs prior month)   │
│                  │        │ • Booking volume trend             │
│                  │        │ • Average ticket value             │
├─────────────────────────────────────────────────────────────────┤
│ Data Quality(20%)│  20%   │ • Sync success rate (7d)           │
│                  │        │ • Hours since last sync            │
│                  │        │ • Unresolved anomalies count       │
└─────────────────────────────────────────────────────────────────┘

RISK LEVELS:
• Healthy: Score >= 70
• At Risk: Score 50-69
• Critical: Score < 50
```

### Edge Function: `calculate-health-scores`

```text
supabase/functions/calculate-health-scores/index.ts

Purpose: Daily calculation of organization health scores

Schedule: 5:00 AM UTC daily via pg_cron (or on-demand)

Logic:
1. Fetch all active organizations
2. For each organization:
   a. Calculate adoption score:
      - Count active users (logged in within 7 days)
      - Calculate login frequency from platform_audit_log
      - Count distinct features used (from audit actions)
   
   b. Calculate engagement score:
      - Count team_chat_messages in last 7 days
      - Calculate announcement view rate
      - Count completed tasks/checklists
   
   c. Calculate performance score:
      - Get revenue from phorest_daily_sales_summary (7d vs prior 7d)
      - Get booking counts from phorest_appointments
      - Calculate average ticket value
   
   d. Calculate data quality score:
      - Query phorest_sync_log for success rate
      - Check hours since last successful sync
      - Count unacknowledged detected_anomalies
   
3. Compute weighted average for total score
4. Determine risk_level based on thresholds
5. Fetch historical scores for trends
6. Generate AI recommendations for low-scoring components
7. Insert into organization_health_scores

AI Recommendations (via Lovable AI):
- For adoption < 60: "Consider scheduling training sessions..."
- For engagement < 60: "Encourage daily check-ins..."
- For performance < 60: "Review booking trends..."
- For data_quality < 60: "Investigate sync failures..."
```

### Frontend Components

| Component | Location | Description |
|-----------|----------|-------------|
| `HealthScoreDashboard.tsx` | `src/pages/dashboard/platform/HealthScores.tsx` | Main dashboard page |
| `HealthScoreCard.tsx` | `src/components/platform/health/HealthScoreCard.tsx` | Individual org health card |
| `HealthScoreGauge.tsx` | `src/components/platform/health/HealthScoreGauge.tsx` | Circular gauge visualization |
| `HealthBreakdownChart.tsx` | `src/components/platform/health/HealthBreakdownChart.tsx` | Radar chart of 4 components |
| `HealthTrendLine.tsx` | `src/components/platform/health/HealthTrendLine.tsx` | Score over time mini-chart |
| `RiskAlertsList.tsx` | `src/components/platform/health/RiskAlertsList.tsx` | At-risk/critical orgs list |
| `HealthRecommendations.tsx` | `src/components/platform/health/HealthRecommendations.tsx` | AI suggestions panel |
| `useOrganizationHealth.ts` | `src/hooks/useOrganizationHealth.ts` | Fetch health data hook |

### Dashboard Layout

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ ORGANIZATION HEALTH                                      [Refresh] [?] │
│ Monitor account health and identify at-risk tenants                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ HEALTHY     │  │ AT RISK     │  │ CRITICAL    │  │ AVG SCORE   │   │
│  │    12       │  │     3       │  │     1       │  │    78.4     │   │
│  │   orgs      │  │   orgs      │  │    org      │  │   (+2.1)    │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐
│  │ AT-RISK ORGANIZATIONS                               [View All →]  │
│  ├─────────────────────────────────────────────────────────────────────┤
│  │ ⚠️ Salon ABC           Score: 52  ↓8   [Adoption: 45] [Engagement:38]│
│  │    "Low login frequency. Consider training refresh."               │
│  │                                                                     │
│  │ ⚠️ Beauty Plus         Score: 61  ↓3   [Data Quality: 48]          │
│  │    "Sync failures detected. Check Phorest credentials."            │
│  │                                                                     │
│  │ 🔴 Hair Studio XYZ     Score: 38  ↓15  [Performance: 32]           │
│  │    "Revenue declined 28%. Schedule check-in call."                 │
│  └─────────────────────────────────────────────────────────────────────┘
│                                                                         │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐
│  │ HEALTH DISTRIBUTION         │  │ SCORE TRENDS (30 DAYS)           │
│  │                             │  │                                   │
│  │   ████████████████░░░░ 75%  │  │   ▁▂▃▄▅▆▇██████████████▇▆        │
│  │   Healthy (12)              │  │   Platform average trending up    │
│  │                             │  │                                   │
│  │   ████░░░░░░░░░░░░░░░ 19%   │  │                                   │
│  │   At Risk (3)               │  │                                   │
│  │                             │  │                                   │
│  │   █░░░░░░░░░░░░░░░░░░░ 6%   │  │                                   │
│  │   Critical (1)              │  │                                   │
│  └──────────────────────────────┘  └──────────────────────────────────┘
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐
│  │ ALL ORGANIZATIONS                        [Search] [Filter: All ▼]  │
│  ├─────────────────────────────────────────────────────────────────────┤
│  │ Organization      Score  Trend  Adoption  Engage  Perform  Quality │
│  │ ───────────────────────────────────────────────────────────────────│
│  │ Drop Dead Salons   92    ↑3     95        88      94       91      │
│  │ Glamour Studio     85    →0     82        78      90       89      │
│  │ Beauty Bar         78    ↑5     75        72      82       83      │
│  │ ...                                                                 │
│  └─────────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Feature 2: Cross-Organization Benchmarking

### Purpose
Compare organizations against each other on key metrics to identify top performers, establish benchmarks, and help struggling accounts learn from successful ones.

### Database Changes

```sql
-- Store benchmark metrics per organization
CREATE TABLE organization_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL, -- 'revenue_per_location', 'appointments_per_staff', etc.
  value NUMERIC NOT NULL,
  percentile INTEGER, -- 0-100, where they rank among peers
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  comparison_group TEXT DEFAULT 'all', -- 'all', 'same_tier', 'same_size'
  metadata JSONB DEFAULT '{}', -- Additional context
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, metric_key, period_start, comparison_group)
);

CREATE INDEX idx_benchmarks_org ON organization_benchmarks(organization_id, metric_key, period_start DESC);
CREATE INDEX idx_benchmarks_metric ON organization_benchmarks(metric_key, period_start DESC);

ALTER TABLE organization_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins view benchmarks" ON organization_benchmarks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM platform_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('platform_owner', 'platform_admin')
    )
  );
```

### Benchmarked Metrics

| Metric Key | Description | Calculation |
|------------|-------------|-------------|
| `revenue_per_location` | Average monthly revenue per location | Total revenue / Location count |
| `appointments_per_staff` | Avg appointments per staff member | Appointments / Active staff |
| `rebooking_rate` | % of clients who rebook | Rebookings / Total appointments |
| `average_ticket` | Average transaction value | Revenue / Transactions |
| `new_client_rate` | % of appointments from new clients | New clients / Total clients |
| `no_show_rate` | % of no-shows | No-shows / Scheduled appointments |
| `product_attachment_rate` | % of visits with retail sales | Product sales / Service appointments |
| `login_frequency` | Avg staff logins per week | Logins / Staff / Weeks |
| `chat_activity` | Messages per active user per week | Messages / Active users / Weeks |

### Edge Function: `calculate-org-benchmarks`

```text
supabase/functions/calculate-org-benchmarks/index.ts

Purpose: Weekly calculation of organization benchmarks

Schedule: Sunday 6:00 AM UTC via pg_cron

Logic:
1. For each metric:
   a. Query data from relevant tables (sales, appointments, etc.)
   b. Calculate value for each organization
   c. Rank organizations and compute percentiles
   d. Store in organization_benchmarks
   
2. Support comparison groups:
   - 'all': Compare against all orgs
   - 'same_tier': Compare within subscription tier
   - 'same_size': Compare by staff count brackets

3. Generate weekly benchmark report for platform admins
```

### Frontend Components

| Component | Location | Description |
|-----------|----------|-------------|
| `BenchmarkDashboard.tsx` | `src/pages/dashboard/platform/Benchmarks.tsx` | Main benchmarks page |
| `BenchmarkLeaderboard.tsx` | `src/components/platform/benchmarks/BenchmarkLeaderboard.tsx` | Top performers table |
| `PercentileIndicator.tsx` | `src/components/platform/benchmarks/PercentileIndicator.tsx` | Visual percentile bar |
| `BenchmarkComparison.tsx` | `src/components/platform/benchmarks/BenchmarkComparison.tsx` | Side-by-side org compare |
| `MetricRankingCard.tsx` | `src/components/platform/benchmarks/MetricRankingCard.tsx` | Single metric ranking |
| `useBenchmarkData.ts` | `src/hooks/useBenchmarkData.ts` | Fetch benchmark data |

### Benchmark Dashboard Layout

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ ORGANIZATION BENCHMARKS                                    [This Week] │
│ Compare performance across all accounts                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  METRIC LEADERBOARDS                                                    │
│  ┌─────────────────────────┐  ┌─────────────────────────┐              │
│  │ REVENUE PER LOCATION    │  │ REBOOKING RATE          │              │
│  │                         │  │                         │              │
│  │ 1. Drop Dead    $45,200 │  │ 1. Beauty Plus    72%   │              │
│  │ 2. Glamour      $38,100 │  │ 2. Drop Dead      68%   │              │
│  │ 3. Beauty Bar   $35,400 │  │ 3. Hair Studio    65%   │              │
│  │ ───────────────────────│  │ ───────────────────────│              │
│  │ Platform Avg:   $32,150 │  │ Platform Avg:     58%   │              │
│  └─────────────────────────┘  └─────────────────────────┘              │
│                                                                         │
│  ┌─────────────────────────┐  ┌─────────────────────────┐              │
│  │ AVERAGE TICKET          │  │ NO-SHOW RATE            │              │
│  │                         │  │                         │              │
│  │ 1. Luxe Spa      $125   │  │ 1. Hair Studio    2.1%  │ (best)      │
│  │ 2. Drop Dead      $98   │  │ 2. Glamour        3.2%  │              │
│  │ 3. Beauty Bar     $85   │  │ 3. Drop Dead      3.8%  │              │
│  │ ───────────────────────│  │ ───────────────────────│              │
│  │ Platform Avg:      $78  │  │ Platform Avg:     5.2%  │              │
│  └─────────────────────────┘  └─────────────────────────┘              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐
│  │ ORGANIZATION COMPARISON                                             │
│  │                                                                     │
│  │ Select orgs: [Drop Dead Salons ▼] vs [Glamour Studio ▼]            │
│  │                                                                     │
│  │              Drop Dead        Glamour       Difference              │
│  │ Revenue/Loc    $45,200        $38,100       +$7,100 (+19%)         │
│  │ Avg Ticket       $98           $82          +$16 (+20%)            │
│  │ Rebooking        68%           62%          +6%                     │
│  │ No-Show          3.8%          4.5%         -0.7% (better)         │
│  │ Staff Logins     4.2/wk        2.8/wk       +1.4/wk                │
│  └─────────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Integration: Account Detail Health Tab

Add a new "Health" tab to the existing Account Detail page showing:
- Current health score with gauge
- Component breakdown radar chart
- Historical score trend (30 days)
- Benchmark rankings for this org
- AI recommendations

```text
AccountDetail.tsx - New Health Tab
┌─────────────────────────────────────────────────────────────────────────┐
│ [Overview] [Locations] [Users] [Migration] [Billing] [Health] [Notes]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────┐  ┌────────────────────────────────────────┐  │
│  │                      │  │ COMPONENT BREAKDOWN                     │  │
│  │    HEALTH SCORE      │  │                                        │  │
│  │        ┌───┐         │  │         Adoption                       │  │
│  │       /     \        │  │            ●                           │  │
│  │      │  78   │       │  │           /│\                          │  │
│  │       \     /        │  │ Data     / │ \ Engagement              │  │
│  │        └───┘         │  │ Quality ●──┼──●                        │  │
│  │                      │  │           \ │ /                        │  │
│  │   ✓ Healthy          │  │            \│/                         │  │
│  │                      │  │            ●                           │  │
│  └──────────────────────┘  │       Performance                      │  │
│                            └────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐
│  │ BENCHMARK RANKINGS (vs all organizations)                          │
│  │                                                                     │
│  │ Revenue/Location:  Top 15%  ████████████████░░░░░                  │
│  │ Rebooking Rate:    Top 25%  █████████████░░░░░░░░                  │
│  │ Average Ticket:    Top 20%  ███████████████░░░░░░                  │
│  │ No-Show Rate:      Top 40%  ████████░░░░░░░░░░░░░                  │
│  └─────────────────────────────────────────────────────────────────────┘
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐
│  │ AI RECOMMENDATIONS                                                  │
│  │                                                                     │
│  │ 💡 Engagement could improve with more team announcements.          │
│  │    This org posts 1.2 announcements/week vs platform avg of 3.5.   │
│  │                                                                     │
│  │ 💡 No-show rate is above average. Consider enabling SMS reminders. │
│  └─────────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Health Score Foundation (Week 1)
1. Create `organization_health_scores` table with migration
2. Build `calculate-health-scores` edge function
3. Create `useOrganizationHealth` hook
4. Build `HealthScoreGauge` and `HealthBreakdownChart` components
5. Create basic `HealthScoreDashboard` page

### Phase 2: Health Dashboard Complete (Week 2)
1. Add risk alerts list with filtering
2. Implement AI recommendations generation
3. Add historical trends visualization
4. Create health distribution chart
5. Add "Health" tab to AccountDetail page

### Phase 3: Benchmarking Foundation (Week 3)
1. Create `organization_benchmarks` table
2. Build `calculate-org-benchmarks` edge function
3. Create `useBenchmarkData` hook
4. Build `BenchmarkLeaderboard` component
5. Create `PercentileIndicator` component

### Phase 4: Benchmarking Complete (Week 4)
1. Build full `BenchmarkDashboard` page
2. Add side-by-side organization comparison
3. Integrate benchmark rankings into Account Health tab
4. Add benchmark filters (tier, size)
5. Add navigation links to Platform sidebar

---

## File Changes Summary

| Category | New Files | Modified Files |
|----------|-----------|----------------|
| Database | 1 migration | - |
| Edge Functions | 2 new | - |
| Hooks | 2 new | - |
| Components | 12+ new | `AccountDetail.tsx` |
| Pages | 2 new | `PlatformSidebar.tsx`, `App.tsx` |

### New Files to Create

```text
supabase/migrations/
└── 2026XXXX_organization_health_and_benchmarks.sql

supabase/functions/
├── calculate-health-scores/index.ts
└── calculate-org-benchmarks/index.ts

src/hooks/
├── useOrganizationHealth.ts
└── useBenchmarkData.ts

src/components/platform/health/
├── HealthScoreGauge.tsx
├── HealthBreakdownChart.tsx
├── HealthTrendLine.tsx
├── HealthScoreCard.tsx
├── RiskAlertsList.tsx
└── HealthRecommendations.tsx

src/components/platform/benchmarks/
├── BenchmarkLeaderboard.tsx
├── PercentileIndicator.tsx
├── BenchmarkComparison.tsx
└── MetricRankingCard.tsx

src/pages/dashboard/platform/
├── HealthScores.tsx
└── Benchmarks.tsx
```

---

## Technical Notes

1. **Score Calculation**: Edge function aggregates data from multiple tables efficiently using CTEs
2. **Caching**: Health scores calculated once daily; real-time updates not needed
3. **AI Recommendations**: Use `google/gemini-3-flash-preview` via Lovable AI for low-latency suggestions
4. **Percentiles**: Calculated using SQL `PERCENT_RANK()` window function
5. **RLS Security**: Only platform roles with Level 3+ access can view health/benchmark data
6. **Performance**: Indexes on organization_id, metric_key, and period columns for fast queries

---

## Success Metrics

| Feature | KPI | Target |
|---------|-----|--------|
| Health Dashboard | At-risk identification accuracy | >90% |
| Health Dashboard | Time to identify churning accounts | <7 days |
| Benchmarks | Platform admin usage | Weekly access by >80% |
| Benchmarks | Support call effectiveness | +20% resolution |

---

## Navigation Integration

Add to Platform Sidebar (`PlatformSidebar.tsx`):

```text
Platform Admin
├── Overview
├── Accounts
├── Health Scores ← NEW
├── Benchmarks ← NEW
├── Revenue
├── Migrations
├── Permissions
├── System Health
└── Settings
```
