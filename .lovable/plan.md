
# Create Compare Tab with Multi-Dimensional Comparison Tool

## Overview

Create a new "Compare" sub-tab in the Sales analytics section that consolidates all comparison functionality into one powerful, flexible interface. Users will be able to compare sales data across:

- **Time Ranges** (e.g., This Month vs Last Month, Q1 vs Q2, Custom ranges)
- **Locations** (Side-by-side location performance)
- **Service Categories** (Revenue by category comparison)
- **Year-over-Year** (Current year vs previous year trends)

---

## Current State

Comparison components are scattered across multiple tabs:

| Component | Current Location |
|-----------|------------------|
| `YearOverYearComparison` | Goals tab |
| `HistoricalComparison` | Forecasting tab |
| `LocationComparison` | Overview tab |

---

## New Structure

```text
Sales Analytics
├── Overview
├── Goals
│   └── TeamGoalsCard (YoY moves to Compare)
├── Compare (NEW)
│   ├── Comparison Type Selector
│   ├── Period A vs Period B Controls
│   ├── Comparison Results Grid
│   └── Visualization Charts
├── Staff Performance
├── Forecasting
│   └── (Historical Comparison moves to Compare)
└── Commission
```

---

## UI Design

### Compare Tab Layout

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  COMPARISON BUILDER                                         [📍 Location ▼] │
├─────────────────────────────────────────────────────────────────────────────┤
│  Compare By:  [Time Periods] [Locations] [Service Categories] [Year/Year]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐      ┌─────────────────────────┐              │
│  │  PERIOD A               │  VS  │  PERIOD B               │              │
│  │  [This Month ▼]         │      │  [Last Month ▼]         │              │
│  │  Jan 1 - Jan 28, 2026   │      │  Dec 1 - Dec 31, 2025   │              │
│  └─────────────────────────┘      └─────────────────────────┘              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  COMPARISON RESULTS                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │   $45,230    │ │   $38,410    │ │    +17.8%    │ │   +$6,820    │       │
│  │  Period A    │ │  Period B    │ │   Change     │ │  Difference  │       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  [Side-by-side bar chart showing Period A vs Period B breakdown]      │ │
│  │                                                                        │ │
│  │  Revenue      ████████████████████  $45k                               │ │
│  │               ██████████████  $38k                                     │ │
│  │                                                                        │ │
│  │  Services     ████████████████████  $32k                               │ │
│  │               █████████████  $27k                                      │ │
│  │                                                                        │ │
│  │  Products     ████████████  $13k                                       │ │
│  │               ██████████  $11k                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  DETAILED BREAKDOWN                                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Metric          │ Period A    │ Period B    │ Change   │ Trend        │ │
│  ├──────────────────┼─────────────┼─────────────┼──────────┼──────────────┤ │
│  │  Total Revenue   │ $45,230     │ $38,410     │ +17.8%   │ ↑            │ │
│  │  Service Revenue │ $32,100     │ $27,200     │ +18.0%   │ ↑            │ │
│  │  Product Revenue │ $13,130     │ $11,210     │ +17.1%   │ ↑            │ │
│  │  Transactions    │ 342         │ 298         │ +14.8%   │ ↑            │ │
│  │  Avg Ticket      │ $132        │ $129        │ +2.3%    │ ↑            │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Location Comparison Mode

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Compare By:  [Time Periods] [Locations*] [Service Categories] [Year/Year] │
├─────────────────────────────────────────────────────────────────────────────┤
│  Select Locations:  [☑ Salon A] [☑ Salon B] [☐ Salon C]                    │
│  Time Period: [This Month ▼]                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────┐   ┌──────────────────────────┐               │
│  │  SALON A                 │   │  SALON B                 │               │
│  │  $28,450                 │   │  $16,780                 │               │
│  │  ████████████████████    │   │  ████████████            │               │
│  │  62% of total            │   │  38% of total            │               │
│  └──────────────────────────┘   └──────────────────────────┘               │
│                                                                             │
│  [Pie chart showing revenue distribution]                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Service Category Comparison Mode

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Compare By:  [Time Periods] [Locations] [Service Categories*] [Year/Year] │
├─────────────────────────────────────────────────────────────────────────────┤
│  Compare: [Period A: This Month] vs [Period B: Last Month]                  │
│  Breakdown by: [Service Category]                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Category         │ Period A    │ Period B    │ Change   │ Growth      │ │
│  ├───────────────────┼─────────────┼─────────────┼──────────┼─────────────┤ │
│  │  Color Services   │ $18,200     │ $15,400     │ +18.2%   │ ████████ ↑  │ │
│  │  Cuts & Styling   │ $12,100     │ $11,800     │ +2.5%    │ ██ ↑        │ │
│  │  Treatments       │ $8,400      │ $6,200      │ +35.5%   │ ██████████↑ │ │
│  │  Extensions       │ $4,200      │ $4,800      │ -12.5%   │ ████ ↓      │ │
│  │  Retail Products  │ $2,330      │ $1,210      │ +92.6%   │ ██████████↑ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Create New Compare Tab Components

**File: `src/components/dashboard/sales/compare/CompareTabContent.tsx`**

Main container component that orchestrates the comparison interface:

```tsx
// Core structure
- CompareTypeSelector (tabs for Time/Location/Category/YoY)
- PeriodSelector (for choosing what to compare)
- ComparisonResults (displays metrics and changes)
- ComparisonChart (visual representation)
- DetailedBreakdownTable (tabular data)
```

**File: `src/components/dashboard/sales/compare/CompareTypeSelector.tsx`**

Toggle between comparison modes:
- Time Periods (default)
- Locations
- Service Categories
- Year-over-Year

**File: `src/components/dashboard/sales/compare/PeriodSelector.tsx`**

Flexible date range picker for comparison:
- Preset options (This Month vs Last Month, This Week vs Last Week, etc.)
- Custom date range selection for both periods
- Visual display of selected periods

**File: `src/components/dashboard/sales/compare/ComparisonResultsGrid.tsx`**

Displays comparison metrics in a clean grid:
- Period A total
- Period B total
- Percent change
- Absolute difference
- Trend indicator

**File: `src/components/dashboard/sales/compare/ComparisonChart.tsx`**

Side-by-side bar chart visualization:
- Revenue breakdown
- Service vs Product split
- Optional stacked view

**File: `src/components/dashboard/sales/compare/CategoryComparisonTable.tsx`**

When comparing by service category:
- Lists all categories with Period A and B values
- Shows growth/decline indicators
- Sortable by any column

### Phase 2: Create Comparison Data Hook

**File: `src/hooks/useComparisonData.ts`**

Flexible hook that fetches comparison data based on mode:

```tsx
interface ComparisonParams {
  mode: 'time' | 'location' | 'category' | 'yoy';
  periodA: { dateFrom: string; dateTo: string };
  periodB: { dateFrom: string; dateTo: string };
  locationIds?: string[];
  categoryFilter?: string;
}

// Returns:
interface ComparisonResult {
  periodA: { revenue, services, products, transactions, avgTicket };
  periodB: { revenue, services, products, transactions, avgTicket };
  changes: { revenueChange, servicesChange, ... };
  categoryBreakdown?: CategoryData[];
  locationBreakdown?: LocationData[];
}
```

### Phase 3: Update SalesTabContent.tsx

Add the new Compare tab to the sub-tabs:

```tsx
<SubTabsTrigger value="compare">Compare</SubTabsTrigger>

<TabsContent value="compare">
  <PinnableCard elementKey="comparison_builder" ...>
    <CompareTabContent 
      filters={filters}
      filterContext={filterContext}
    />
  </PinnableCard>
</TabsContent>
```

Move existing components:
- Remove `YearOverYearComparison` from Goals tab (integrate into Compare)
- Remove `HistoricalComparison` from Forecasting tab (integrate into Compare)
- Keep `LocationComparison` in Overview (it's a quick glance) but enhanced version in Compare

### Phase 4: Move Existing Comparison Components

The Compare tab will integrate existing components as "quick modes":

| Mode | Component Used |
|------|----------------|
| Year-over-Year | Enhanced `YearOverYearComparison` |
| Period vs Period | Enhanced `HistoricalComparison` with more controls |
| Location vs Location | Enhanced `LocationComparison` with multi-select |
| Category Breakdown | New component using `phorest_transaction_items` data |

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/sales/compare/CompareTabContent.tsx` | Main container |
| `src/components/dashboard/sales/compare/CompareTypeSelector.tsx` | Mode toggle |
| `src/components/dashboard/sales/compare/PeriodSelector.tsx` | Date range controls |
| `src/components/dashboard/sales/compare/ComparisonResultsGrid.tsx` | Metrics display |
| `src/components/dashboard/sales/compare/ComparisonChart.tsx` | Bar chart |
| `src/components/dashboard/sales/compare/CategoryComparisonTable.tsx` | Category breakdown |
| `src/hooks/useComparisonData.ts` | Unified comparison data hook |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Add Compare sub-tab, move YoY from Goals, move Historical from Forecasting |

---

## Technical Notes

### Data Sources

- **Time/Period comparison**: `phorest_daily_sales_summary` table
- **Location comparison**: `phorest_daily_sales_summary` grouped by `location_id`
- **Category comparison**: `phorest_transaction_items` grouped by `item_category`
- **Year-over-Year**: `phorest_daily_sales_summary` filtered by year

### Existing Hooks to Leverage

- `useSalesComparison` - Already compares two periods
- `useSalesByLocation` - Location breakdown
- `useProductCategoryBreakdown` - Category data
- `useServicePopularity` - Service frequency data

### Default Behavior

- Opens with "Time Periods" mode selected
- Default comparison: This Month vs Last Month
- Respects the page-level location filter from Analytics Hub
- Pinnable as a single card called "Comparison Builder"

---

## User Experience

1. User navigates to Sales > Compare tab
2. Sees comparison type selector at top
3. Chooses what to compare (Time, Location, Category, YoY)
4. Configures the comparison parameters
5. Results update in real-time with:
   - Summary metrics (4-card grid)
   - Visual chart
   - Detailed breakdown table
6. Can pin the entire comparison builder to their dashboard
