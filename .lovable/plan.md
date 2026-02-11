

# Clarify Tips in Revenue Metrics and Add Tips Analytic

## Current State

- `phorest_appointments` has `total_price` (service price) and `tip_amount` (separate column)
- Currently no tips have been recorded yet (all tip_amount = 0), but they will populate as appointments check out
- The "Total Revenue" tooltip says "Sum of all service and product sales" -- does not mention tips
- The drill-down queries `total_price` which excludes tips -- correct behavior, but not labeled
- `phorest_daily_sales_summary` has no tips column at all

## Changes

### 1. Update tooltip descriptions for clarity

In `AggregateSalesCard.tsx`:

- **Total Revenue** tooltip: Change to "Sum of all service and product sales. Tips are excluded."
- **Services** sub-card: Add a tooltip "Revenue from booked services. Tips are tracked separately."
- **Avg Ticket** tooltip: Change to "Total Revenue (excluding tips) / Transactions."

### 2. Add a Tips metric to the secondary KPIs row

Add a fourth KPI alongside Transactions, Avg Ticket, and Rev/Hour:

```
[20 Transactions] [$91 Avg Ticket] [$66 Rev/Hour] [$0 Tips]
```

- Query `SUM(tip_amount)` from `phorest_appointments` for the selected date range and location
- Tooltip: "Total tips collected from completed appointments."
- This gives operators visibility into tips as a standalone metric

### 3. Update the drill-down to show tips per stylist

In `useServiceProductDrilldown.ts`:
- Also select and aggregate `tip_amount` per staff member
- Add `tipTotal` to the `StaffServiceProduct` interface

In `ServiceProductDrilldown.tsx` (services mode):
- Show tips as a secondary line in each stylist row: "18 services, 33% of total, $X tips"

### 4. Add `tip_amount` aggregation to the sales summary hook

In the hook that powers the main sales card (likely `useSalesSummary` or the expected revenue logic):
- Add a separate query to `phorest_appointments` for `SUM(tip_amount)` so the Tips KPI has data
- This keeps tips clearly separated from service/product revenue

## Files to Edit

| File | Change |
|---|---|
| `src/components/dashboard/AggregateSalesCard.tsx` | Update tooltip text, add Tips KPI to secondary row |
| `src/hooks/useServiceProductDrilldown.ts` | Add `tip_amount` to query and aggregation |
| `src/components/dashboard/ServiceProductDrilldown.tsx` | Display tip totals per stylist |
| New or existing sales hook | Add tips aggregation query for the main card |

