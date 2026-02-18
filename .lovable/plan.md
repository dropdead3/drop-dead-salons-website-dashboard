

## Service Costs and Sales Profits Card — Analysis and Enhancement Plan

### Errors Found

1. **Bar visualization uses "relative to max" logic instead of "share of total"**
   The inline bar in the Total Sales column calculates width as `row.totalSales / data.maxSales * 100`. Per your platform standard, revenue bars should represent each row's share of the total revenue (value / sum of all values), not relative to the highest value. The current logic makes the top row always 100% wide, which misrepresents actual contribution.

2. **Bar colors use hardcoded Tailwind classes instead of CSS variable tokens**
   The `barColors` array uses `bg-emerald-500`, `bg-blue-500`, etc. These should use the design system chart colors (`hsl(var(--chart-1))` through `--chart-5` and `--primary`), applied via inline `style` rather than Tailwind class names, for theme consistency.

3. **Loading state header is not standard**
   The loading skeleton card is missing the `justify-between` two-column layout, the `MetricInfoTooltip`, and the `AnalyticsFilterBadge`. It also isn't wrapped in `PinnableCard`, which means the card flashes between two different DOM structures as data loads.

4. **Empty state not wrapped in PinnableCard**
   Same issue — when there's no data, the card loses its pinnable behavior.

### Gaps

5. **"Cost per Service" column is missing from the table**
   The hook calculates and returns `costPerService` for each row, but the UI never displays it. The original plan called for showing this column. Owners need to see the unit cost to validate that their service costs are entered correctly.

6. **No visual indicator for services with no cost defined**
   When a service has no cost in the `services` table, the card silently shows `$0` cost and `100%` profit. This is misleading. There should be a subtle indicator (e.g., a muted dash or a small "not set" badge) so the owner knows the profit figure is unreliable for that row.

7. **No summary KPIs above the table**
   The card jumps straight from the header into a dense table. Adding 3-4 small KPI tiles above the table (Total Revenue, Total Cost, Total Profit, Avg Profit %) would give executives the headline numbers at a glance without scanning the entire table.

### UI and Organization Enhancements

8. **Group by category with collapsible sections**
   For salons with 30+ services, this table becomes very long. Grouping rows by Service Category with collapsible sections (defaulting to expanded) would make it much more scannable. Each category group header could show its subtotal.

9. **Highlight rows missing cost data**
   Rows where cost is not configured could have a subtle left-border accent or muted background to draw the owner's attention to incomplete data, reinforcing the incentive to enter costs in Settings.

10. **Column alignment**
    The `SortHeader` component passes `className="text-right"` to `TableHead`, but the sort icon and label are in a `flex` container that defaults to left alignment. Right-aligned numeric headers should use `justify-end` on the inner flex to actually right-align the header text with the cell data below it.

### Technical Changes

**File: `src/components/dashboard/sales/ServiceCostsProfitsCard.tsx`**

- Fix bar width calculation: `(row.totalSales / data.totals.totalSales) * 100`
- Replace hardcoded `barColors` array with CSS variable-based inline styles using `--chart-1` through `--chart-5`
- Add `costPerService` column between "# Services" and "Total Sales" (or between "Total Sales" and "Cost")
- Add a "not set" indicator when `costPerService === 0` and the service wasn't found in the cost map (requires a small data change in the hook to flag this)
- Wrap loading and empty states in `PinnableCard`
- Fix loading state header to match the standard two-column layout with tooltip and filter badge
- Fix `SortHeader` to use `justify-end` when `className` includes `text-right`
- Add 3-4 summary KPI tiles above the table (Total Revenue, Total Cost, Total Profit, Avg Margin %)

**File: `src/hooks/useServiceCostsProfits.ts`**

- Add a `hasCostDefined: boolean` field to `ServiceCostProfitRow` so the UI can distinguish between "cost is $0" and "cost was never entered"
- Change `maxSales` to `totalSalesSum` (or just use `totals.totalSales`) since the bar now uses share-of-total logic

These changes keep the card structurally the same (single table with totals row) but fix the data integrity issues, align with the design system, and add the contextual cues that make this card actionable for salon owners.

