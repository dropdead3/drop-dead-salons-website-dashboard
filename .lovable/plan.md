

## Platform Owner Analytics Hub - Deep Organization Intelligence

This plan creates a comprehensive, owner-only analytics dashboard that provides unprecedented visibility into all organizations using your platform, featuring multi-dimensional leaderboards, deep operational metrics, and cross-organization comparisons.

---

### Overview

The Analytics Hub will be a **platform_owner exclusive** section that aggregates and analyzes data from every organization, providing:

- **Organization Leaderboards**: Rank organizations by revenue, user counts, engagement, and operational metrics
- **Size & Growth Analytics**: Track organization growth trajectories (locations, users, revenue)
- **Operational Deep-Dive**: Aggregate Phorest performance metrics across all organizations
- **Revenue Intelligence**: Per-organization revenue tracking beyond subscription fees (actual salon revenue)
- **Engagement Metrics**: How actively each organization uses the platform
- **Comparative Analysis**: Benchmark organizations against each other and platform averages

---

### Changes Summary

| Area | File | Action |
|------|------|--------|
| New Page | `src/pages/dashboard/platform/Analytics.tsx` | **Create** - Main analytics hub with tabs |
| New Hooks | `src/hooks/useOrganizationAnalytics.ts` | **Create** - Comprehensive data aggregation |
| New Components | `src/components/platform/analytics/` | **Create** - Charts, leaderboards, tables |
| Sidebar | `PlatformSidebar.tsx` | **Edit** - Add owner-only nav link |
| Routing | `App.tsx` | **Edit** - Add protected route |

---

### Data Sources for Analytics

Based on your existing database schema, we can aggregate:

**Size Metrics (per organization):**
- Location count (from `locations` table)
- Active user count (from `employee_profiles`)
- Client count (from `phorest_clients` via location mapping)
- Total appointments (from `phorest_appointments`)

**Revenue Metrics:**
- Subscription revenue (from `organization_billing` + `subscription_plans`)
- Actual salon revenue (from `phorest_daily_sales_summary` aggregated by location → org)
- Average ticket size
- Product vs service revenue split

**Performance Metrics:**
- Rebooking rate (from `phorest_performance_metrics`)
- Retention rate
- New clients acquired
- Retail attachment rate

**Engagement Metrics (NEW - would need tracking):**
- Dashboard logins per organization
- Feature usage patterns
- Active users vs total users ratio

---

### Page Structure & Tabs

The Analytics Hub will use a tabbed interface:

```text
+------------------------------------------------------------------+
|  Organization Analytics                    [Owner Only Badge]     |
|  Deep intelligence across all accounts                            |
+------------------------------------------------------------------+
|                                                                   |
|  [Overview] [Leaderboards] [Revenue Intel] [Operational] [Growth] |
|                                                                   |
+------------------------------------------------------------------+
```

#### Tab 1: Overview
- **Key Stats Grid**: Total organizations, combined revenue, total users, total locations
- **Top 5 Quick Glance**: Largest orgs by revenue, most users, fastest growing
- **Health Distribution**: Pie chart of subscription statuses
- **Geographic Distribution**: Organizations by country/region

#### Tab 2: Leaderboards (THE CORE FEATURE)
Interactive leaderboards with trophy/medal styling:

| Leaderboard | Metric | Data Source |
|-------------|--------|-------------|
| Revenue Champions | Monthly salon revenue | `phorest_daily_sales_summary` |
| Size Leaders | Total locations + users | `locations` + `employee_profiles` |
| Growth Stars | MoM location/user growth | Historical comparison |
| Engagement Leaders | Active users ratio | Login tracking (future) |
| Performance Elite | Avg rebooking + retention | `phorest_performance_metrics` |
| Client Magnets | New clients acquired | `phorest_performance_metrics` |
| Retail Warriors | Retail attachment % | `phorest_performance_metrics` |

Each leaderboard shows:
- Rank position with trophy/medal icons
- Organization name + account number
- Primary metric value
- Trend indicator (up/down from last period)
- Click to drill into organization detail

#### Tab 3: Revenue Intelligence
- **Platform Revenue**: MRR/ARR from subscriptions (existing)
- **Salon Revenue Aggregation**: Total revenue flowing through customer salons
- **Revenue per Location**: Average across all orgs
- **Revenue Distribution**: Histogram showing revenue bands
- **Top Revenue by Tier**: See which plan tier generates most salon revenue
- **Month-over-Month Trend**: Combined revenue growth chart

#### Tab 4: Operational Metrics
Aggregated performance data across all organizations:

- **Platform-Wide Averages**:
  - Average rebooking rate
  - Average retention rate
  - Average ticket size
  - Retail attachment rate

- **Organization Comparison Matrix**:
  Table showing all organizations with columns for each KPI, sortable and filterable

- **Outlier Detection**:
  Highlight organizations significantly above/below platform averages

#### Tab 5: Growth Analytics
- **Account Growth Timeline**: New accounts per month (area chart)
- **Location Expansion**: Total locations over time
- **User Growth**: Platform-wide user count trend
- **Churn Analysis**: Accounts lost per period
- **Cohort Analysis**: Retention by signup month

---

### Implementation Details

#### 1. New Hook: `useOrganizationAnalytics.ts`

```typescript
interface OrganizationMetrics {
  id: string;
  name: string;
  accountNumber: number;
  subscriptionTier: string;
  
  // Size
  locationCount: number;
  userCount: number;
  activeUserCount: number;
  clientCount: number;
  
  // Revenue (salon, not subscription)
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueGrowth: number;
  averageTicket: number;
  
  // Performance
  avgRebookingRate: number;
  avgRetentionRate: number;
  avgRetailAttachment: number;
  newClientsThisMonth: number;
  
  // Engagement
  activeUsersRatio: number;
  lastActivityAt: string | null;
}

interface PlatformAnalyticsSummary {
  totalOrganizations: number;
  totalLocations: number;
  totalUsers: number;
  totalClients: number;
  
  combinedMonthlyRevenue: number;
  avgRevenuePerOrg: number;
  avgRevenuePerLocation: number;
  
  platformAvgRebooking: number;
  platformAvgRetention: number;
  platformAvgTicket: number;
  
  organizationMetrics: OrganizationMetrics[];
  
  // Leaderboard data
  topByRevenue: OrganizationMetrics[];
  topBySize: OrganizationMetrics[];
  topByGrowth: OrganizationMetrics[];
  topByPerformance: OrganizationMetrics[];
}
```

The hook will:
1. Fetch all organizations
2. Aggregate location counts per org
3. Aggregate employee counts per org (via location → org mapping)
4. Aggregate revenue from `phorest_daily_sales_summary` per location → org
5. Aggregate performance metrics from `phorest_performance_metrics`
6. Calculate platform-wide averages
7. Generate sorted leaderboards

#### 2. Leaderboard Component Pattern

```typescript
interface LeaderboardEntry {
  rank: number;
  organizationId: string;
  organizationName: string;
  accountNumber: number;
  value: number;
  previousValue?: number;
  change?: number;
  tier?: string;
}

interface OrganizationLeaderboardProps {
  title: string;
  data: LeaderboardEntry[];
  valueFormatter: (value: number) => string;
  valueLabel: string;
  icon: React.ComponentType;
}
```

Visual style:
- Rank 1: Gold trophy + gold gradient background
- Rank 2: Silver medal + silver gradient
- Rank 3: Bronze medal + bronze gradient
- Ranks 4-10: Numbered with subtle styling
- Trend arrows (green up, red down)

#### 3. Access Control

Route protection in `App.tsx`:

```typescript
<Route 
  path="analytics" 
  element={
    <ProtectedRoute requirePlatformRole="platform_owner">
      <PlatformAnalytics />
    </ProtectedRoute>
  } 
/>
```

Sidebar visibility in `PlatformSidebar.tsx`:

```typescript
{
  href: '/dashboard/platform/analytics',
  label: 'Analytics',
  icon: BarChart3,
  platformRoles: ['platform_owner'], // Owner only!
}
```

---

### Database Considerations

**No new tables required** - all data exists:
- Organizations: `organizations` table
- Locations: `locations` table (has `organization_id`)
- Users: `employee_profiles` table (has `organization_id`)
- Revenue: `phorest_daily_sales_summary` → join via `location_id` → `locations.organization_id`
- Performance: `phorest_performance_metrics` → same join path

**Query Strategy**:
For performance, we'll aggregate server-side where possible:

```sql
-- Example: Revenue per organization
SELECT 
  l.organization_id,
  SUM(pds.total_revenue) as total_revenue,
  AVG(pds.average_ticket) as avg_ticket
FROM phorest_daily_sales_summary pds
JOIN locations l ON pds.location_id = l.id
WHERE pds.summary_date >= NOW() - INTERVAL '30 days'
GROUP BY l.organization_id
```

**Future Enhancement**: Consider a materialized view or cron-updated summary table for large-scale analytics.

---

### Visual Design

Following the platform theme (fintech dark with violet accents):

**Stat Cards**: Large numbers with icons, trend indicators
**Charts**: Recharts with `#8b5cf6` (violet) primary, gradient fills
**Leaderboards**: Trophy/medal iconography, rank numbers with colored backgrounds
**Tables**: Sortable columns with hover states
**Organization Links**: Click any org name to navigate to its detail page

---

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/pages/dashboard/platform/Analytics.tsx` | **New** - Main analytics page with tabs |
| `src/hooks/useOrganizationAnalytics.ts` | **New** - Data aggregation hook |
| `src/components/platform/analytics/AnalyticsOverview.tsx` | **New** - Overview tab |
| `src/components/platform/analytics/OrganizationLeaderboards.tsx` | **New** - Leaderboard tab |
| `src/components/platform/analytics/RevenueIntelligence.tsx` | **New** - Revenue tab |
| `src/components/platform/analytics/OperationalMetrics.tsx` | **New** - Operations tab |
| `src/components/platform/analytics/GrowthAnalytics.tsx` | **New** - Growth tab |
| `src/components/platform/analytics/LeaderboardCard.tsx` | **New** - Reusable leaderboard |
| `src/components/platform/analytics/MetricComparisonTable.tsx` | **New** - Sortable org table |
| `src/components/platform/layout/PlatformSidebar.tsx` | **Edit** - Add nav link |
| `src/App.tsx` | **Edit** - Add protected route |

---

### Technical Notes

1. **Performance**: Cache queries with 5-minute stale time; consider pagination for org lists > 100

2. **Data Completeness**: Handle orgs without Phorest data gracefully (N/A display)

3. **Security**: `platform_owner` only - no other platform roles can access

4. **Drill-down**: All organization names link to `/dashboard/platform/accounts/{slug}` for deeper investigation

5. **Export Ready**: Design tables to support CSV export in future iteration

