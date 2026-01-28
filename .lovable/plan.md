

# Consolidate Sales Cards: Keep Sales Overview, Remove Sales Dashboard

## Overview

The project has two redundant sales cards:
1. **Sales Dashboard** (`SalesBentoCard`) - Recently enhanced with Rev/Hour and Revenue Breakdown
2. **Sales Overview** (`AggregateSalesCard`) - More feature-rich with sparklines, location tables, trend indicators, CSV export

We will consolidate into **Sales Overview** by porting the new features and removing the redundant card.

---

## What Sales Overview Already Has (Keep)

| Feature | Description |
|---------|-------------|
| Multiple date ranges | Today, Yesterday, 7d, 30d, MTD, YTD, Last Year, Last 365 Days |
| Trend indicators | Period-over-period comparison with arrows |
| Location breakdown table | Revenue by location with sparklines |
| Rev. Tomorrow | Projected revenue from booked appointments |
| CSV Export | Download location data |
| Last Sync indicator | Shows data freshness |
| Top Performers sidebar | Leaderboard with avatars |
| Revenue Mix donut | Visual service/product split |
| Goal progress bar | Weekly/Monthly/Yearly adaptive |

---

## What to Port from Sales Dashboard

| Feature | Action |
|---------|--------|
| Rev/Hour KPI | Add as 7th KPI cell using `totalServiceHours` from the hook |

Note: The Revenue Breakdown cell design from Sales Dashboard won't be ported since Sales Overview already shows Services/Products as separate KPIs with trend indicators - a more informative layout.

---

## Technical Changes

### 1. Add Rev/Hour to Sales Overview

**File: `src/components/dashboard/AggregateSalesCard.tsx`**

Import the `Clock` icon and add the Rev/Hour calculation:

```typescript
import { Clock } from 'lucide-react';

// Add after line 113 (isLoading declaration)
const revenuePerHour = useMemo(() => {
  const serviceHours = metrics?.totalServiceHours || 0;
  if (serviceHours === 0) return 0;
  return metrics.totalRevenue / serviceHours;
}, [metrics]);
```

Add a new KPI cell after "Rev. Tomorrow" (around line 402):

```typescript
<div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg min-w-0">
  <div className="flex justify-center mb-2">
    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-chart-5" />
  </div>
  <AnimatedBlurredAmount 
    value={Math.round(revenuePerHour)}
    prefix="$"
    className="text-lg sm:text-xl md:text-2xl font-display tabular-nums truncate block"
  />
  <div className="flex items-center gap-1 justify-center mt-1">
    <p className="text-xs text-muted-foreground">Rev/Hour</p>
    <MetricInfoTooltip description="Total Revenue ÷ Service Hours. Average revenue per hour of stylist work." />
  </div>
</div>
```

### 2. Remove Sales Dashboard from Pinnable Options

**File: `src/components/dashboard/DashboardCustomizeMenu.tsx`**

Remove the `sales_dashboard_bento` entry from `PINNABLE_CARDS` array (line 143).

**File: `src/hooks/useDashboardLayout.ts`**

Remove `'sales_dashboard_bento'` from `PINNABLE_CARD_IDS` array (line 34).

### 3. Remove Rendering Logic for Sales Dashboard

**File: `src/components/dashboard/CommandCenterAnalytics.tsx`**

Remove the `case 'sales_dashboard_bento':` block (lines 158-167) and the `SalesBentoCard` import.

**File: `src/components/dashboard/PinnedAnalyticsCard.tsx`**

Remove the `case 'sales_dashboard_bento':` block (lines 70-79) and the `SalesBentoCard` import.

### 4. Update Analytics Hub Sales Tab

**File: `src/components/dashboard/analytics/SalesTabContent.tsx`**

Replace the `SalesBentoCard` usage with `AggregateSalesCard`:

```typescript
<PinnableCard 
  elementKey="sales_overview" 
  elementName="Sales Overview" 
  category="Analytics Hub - Sales"
>
  <AggregateSalesCard />
</PinnableCard>
```

### 5. Delete Sales Dashboard Component

**File to delete:** `src/components/dashboard/sales/SalesBentoCard.tsx`

---

## Updated KPI Grid in Sales Overview

After adding Rev/Hour, the grid will have 7 KPIs:

| Position | Metric | Icon |
|----------|--------|------|
| 1 | Total Revenue | DollarSign |
| 2 | Services | Scissors |
| 3 | Products | ShoppingBag |
| 4 | Transactions | CreditCard |
| 5 | Avg Ticket | Receipt |
| 6 | Rev. Tomorrow | CalendarClock |
| 7 | **Rev/Hour** | Clock |

---

## Files Summary

| File | Action |
|------|--------|
| `src/components/dashboard/AggregateSalesCard.tsx` | Add Rev/Hour KPI |
| `src/components/dashboard/DashboardCustomizeMenu.tsx` | Remove sales_dashboard_bento from PINNABLE_CARDS |
| `src/hooks/useDashboardLayout.ts` | Remove sales_dashboard_bento from PINNABLE_CARD_IDS |
| `src/components/dashboard/CommandCenterAnalytics.tsx` | Remove SalesBentoCard case and import |
| `src/components/dashboard/PinnedAnalyticsCard.tsx` | Remove SalesBentoCard case and import |
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Replace SalesBentoCard with AggregateSalesCard |
| `src/components/dashboard/sales/SalesBentoCard.tsx` | **Delete** |

