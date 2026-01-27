
# Make All Analytics Hub Sections Pinnable to Command Center

## Overview

Enable every section within the Analytics Hub tabs (Sales, Operations, Marketing, Program, Reports) to be individually pinnable to the Command Center. This provides leadership with an ultra-customized dashboard experience where they can surface the exact analytics cards they need.

---

## Current State

**Analytics Hub Structure:**
| Tab | Sub-sections/Cards |
|-----|-------------------|
| Sales | KPI Cards, Revenue Trend, Location Comparison, Top Performers, Forecasting, Commission Calculator, etc. |
| Operations | Summary Stats, Capacity Utilization, Appointments, Clients, Staffing |
| Marketing | Campaign KPIs, Website Analytics, Source/Medium Charts |
| Program | Enrollment Stats, Funnel, Cohort Analysis, Drop-off Points |
| Reports | Report Generator Cards (not pinnable, action-based) |

**Pinning Mechanism:**
- `CommandCenterVisibilityToggle` component shows gear icon (⚙️)
- Updates `dashboard_element_visibility` table for leadership roles
- `CommandCenterAnalytics` checks visibility and renders pinned cards

**Currently Pinnable (11 cards):**
- sales_overview, new_bookings, week_ahead_forecast, capacity_utilization
- top_performers, revenue_breakdown, client_funnel, team_goals
- hiring_capacity, staffing_trends, stylist_workload

---

## Solution

### New Pinnable Sections to Add

**Sales Tab (8 new):**
1. `sales_kpi_grid` - Main 6-card KPI grid (Total Revenue, Services, Products, Transactions, Avg Ticket, Rev Tomorrow)
2. `revenue_trend_chart` - Daily/weekly revenue line chart
3. `location_comparison` - Multi-location performance comparison
4. `product_category_chart` - Product sales by category
5. `service_popularity_chart` - Service mix breakdown
6. `peak_hours_heatmap` - Busy time analysis
7. `commission_calculator` - Staff commission breakdown
8. `yoy_comparison` - Year-over-year trends

**Operations Tab (7 new):**
1. `operations_summary` - Summary stat cards (Appointments, Completion Rate, No-Show Rate, Retention)
2. `operations_insights` - Quick insights panel (Peak Day, Client Base, At-Risk, Capacity)
3. `appointments_volume_chart` - Daily appointment trends
4. `status_breakdown_chart` - Completed vs No-Show vs Cancelled
5. `hourly_distribution` - Peak hours analysis
6. `retention_metrics` - Client retention breakdown
7. `at_risk_clients_list` - Clients needing follow-up

**Marketing Tab (5 new):**
1. `marketing_kpis` - Main KPI grid (Campaigns, Leads, Revenue, Conversion, Top Campaign)
2. `marketing_roi_metrics` - ROI cards (Budget, Spend, CPL, ROAS)
3. `campaign_performance_table` - Campaign details table
4. `source_breakdown_chart` - Traffic source analysis
5. `medium_distribution_chart` - Marketing medium breakdown

**Program Tab (5 new):**
1. `program_summary_stats` - Enrollment, Completion Rate, Avg Streak, At Risk
2. `program_funnel` - Completion funnel visualization
3. `program_daily_trends` - Daily completions chart
4. `program_cohorts` - Cohort analysis table
5. `program_dropoff` - Drop-off analysis chart

---

## Implementation Plan

### 1. Create `PinnableCard` Wrapper Component

A reusable wrapper that adds the pinning gear icon to any analytics card:

**File: `src/components/dashboard/PinnableCard.tsx`**

```typescript
interface PinnableCardProps {
  elementKey: string;
  elementName: string;
  children: React.ReactNode;
  className?: string;
}

export function PinnableCard({ elementKey, elementName, children, className }: PinnableCardProps) {
  return (
    <div className={cn("relative group", className)}>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <CommandCenterVisibilityToggle 
          elementKey={elementKey} 
          elementName={elementName} 
        />
      </div>
      {children}
    </div>
  );
}
```

### 2. Update Tab Content Components

Wrap each pinnable section with `PinnableCard`:

**File: `src/components/dashboard/analytics/SalesTabContent.tsx`**

```typescript
// Wrap KPI Grid
<PinnableCard elementKey="sales_kpi_grid" elementName="Sales KPIs">
  <div className="grid gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3">
    {/* KPI cards */}
  </div>
</PinnableCard>

// Wrap Revenue Trend
<PinnableCard elementKey="revenue_trend_chart" elementName="Revenue Trend">
  <Card>
    <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
    {/* Chart content */}
  </Card>
</PinnableCard>
```

Apply same pattern to:
- `OperationsTabContent.tsx` (OverviewContent, AppointmentsContent, etc.)
- `MarketingTabContent.tsx`
- `ProgramTabContent.tsx`

### 3. Update CommandCenterAnalytics

Add rendering logic for all new pinnable sections:

**File: `src/components/dashboard/CommandCenterAnalytics.tsx`**

```typescript
// Add visibility checks for new sections
const hasSalesKpis = isElementVisible('sales_kpi_grid');
const hasRevenueTrend = isElementVisible('revenue_trend_chart');
const hasLocationComparison = isElementVisible('location_comparison');
// ... etc for all new sections

// Add conditional rendering
{hasSalesKpis && (
  <VisibilityGate elementKey="sales_kpi_grid">
    <SalesKPIGrid metrics={salesData} />
  </VisibilityGate>
)}

{hasRevenueTrend && (
  <VisibilityGate elementKey="revenue_trend_chart">
    <RevenueTrendCard dateFrom={dateFrom} dateTo={dateTo} />
  </VisibilityGate>
)}
// ... etc
```

### 4. Create Standalone Card Components

Extract reusable card components that can be used both in Analytics Hub AND Command Center:

| Component | Source | New File |
|-----------|--------|----------|
| SalesKPIGrid | SalesTabContent inline | `SalesKPIGrid.tsx` |
| RevenueTrendCard | SalesTabContent inline | `RevenueTrendCard.tsx` |
| OperationsSummaryCard | OverviewContent inline | Already exists as inline |
| MarketingKPIsCard | MarketingTabContent inline | `MarketingKPIsCard.tsx` |
| ProgramSummaryCard | ProgramTabContent inline | `ProgramSummaryCard.tsx` |

### 5. Update DashboardCustomizeMenu

Add a new "Pinned Analytics" section to the customize drawer for leadership users:

**File: `src/components/dashboard/DashboardCustomizeMenu.tsx`**

```typescript
// Add after Widgets section for leadership users
{roleContext?.isLeadership && (
  <>
    <Separator />
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        PINNED ANALYTICS
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Pin cards from the Analytics Hub using the ⚙ icon
      </p>
      <Button variant="ghost" size="sm" className="w-full" asChild>
        <Link to="/dashboard/admin/analytics">
          Open Analytics Hub
        </Link>
      </Button>
    </div>
  </>
)}
```

### 6. Update Visibility Console

Add all new pinnable elements to the "Command Center Analytics" category:

**File: `src/components/dashboard/settings/CommandCenterContent.tsx`**

Update the category filter logic to include the new elements. Since VisibilityGate auto-registers elements, this should happen automatically on first render, but we can add a category constant for reference:

```typescript
const ANALYTICS_PINNABLE_ELEMENTS = [
  // Sales
  'sales_kpi_grid', 'revenue_trend_chart', 'location_comparison',
  'product_category_chart', 'service_popularity_chart', 'peak_hours_heatmap',
  'commission_calculator', 'yoy_comparison',
  // Operations
  'operations_summary', 'operations_insights', 'appointments_volume_chart',
  'status_breakdown_chart', 'hourly_distribution', 'retention_metrics', 'at_risk_clients_list',
  // Marketing
  'marketing_kpis', 'marketing_roi_metrics', 'campaign_performance_table',
  'source_breakdown_chart', 'medium_distribution_chart',
  // Program
  'program_summary_stats', 'program_funnel', 'program_daily_trends',
  'program_cohorts', 'program_dropoff',
];
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/PinnableCard.tsx` | New - wrapper component with gear icon |
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Wrap sections with PinnableCard |
| `src/components/dashboard/analytics/OperationsTabContent.tsx` | Wrap sections with PinnableCard |
| `src/components/dashboard/analytics/OverviewContent.tsx` | Wrap sections with PinnableCard |
| `src/components/dashboard/analytics/AppointmentsContent.tsx` | Wrap sections with PinnableCard |
| `src/components/dashboard/analytics/ClientsContent.tsx` | Wrap sections with PinnableCard |
| `src/components/dashboard/analytics/MarketingTabContent.tsx` | Wrap sections with PinnableCard |
| `src/components/dashboard/analytics/ProgramTabContent.tsx` | Wrap sections with PinnableCard |
| `src/components/dashboard/CommandCenterAnalytics.tsx` | Add visibility checks and rendering for all new sections |
| `src/components/dashboard/DashboardCustomizeMenu.tsx` | Add Pinned Analytics section for leadership |
| `src/hooks/useDashboardLayout.ts` | Already supports pinnedCards array |

---

## UI/UX Flow

1. **Analytics Hub**: Each major section shows a ⚙ gear icon on hover (top-right corner)
2. **Click Gear**: Opens popover with "Show on Command Center" toggle
3. **Toggle On**: Card appears in Command Center for all leadership roles
4. **Command Center**: Displays all pinned cards in a logical layout
5. **Customize Drawer**: Shows "Pinned Analytics" section with link to Analytics Hub

---

## Result

Leadership users can build a fully customized Command Center by:
- Visiting the Analytics Hub
- Hovering over any section they want to monitor
- Clicking the gear icon to pin it to Command Center
- Their pinned selections persist and display on their dashboard
