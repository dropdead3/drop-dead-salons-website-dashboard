
# Fill Sidebar Space: Stretch Top Performers Card

## Problem
The sidebar column has significant unused vertical space below the two compact cards (Top Performers + Revenue Breakdown). The left column (KPIs + goal progress) is taller, leaving a visual gap on the right.

## Solution
Make the sidebar a flex column that stretches to match the left column height, with Top Performers taking all remaining space via `flex-1`. This way the card grows responsively to fill the bento rectangle.

## Technical Details

### File: `src/components/dashboard/AggregateSalesCard.tsx`
- **Line 526**: Change `space-y-3 min-w-0` to `flex flex-col gap-3 min-w-0` so the sidebar becomes a flex column
- TopPerformersCard wrapper: add `flex-1` so it stretches to fill remaining space
- RevenueDonutChart stays auto-sized at the bottom

```text
Before:
<div className="space-y-3 min-w-0">
  <TopPerformersCard ... />
  <RevenueDonutChart ... />
</div>

After:
<div className="flex flex-col gap-3 min-w-0">
  <div className="flex-1">
    <TopPerformersCard ... />
  </div>
  <RevenueDonutChart ... />
</div>
```

### File: `src/components/dashboard/sales/TopPerformersCard.tsx`
- Add `h-full` to all three Card return paths (loading, empty, populated) so the card stretches to fill its flex-1 wrapper
- Add `flex flex-col` to the Card so content distributes vertically
- Add `flex-1` to CardContent so the performer list (or empty state) fills the available height
- For the empty state, center the "No sales data available" message vertically with `flex items-center justify-center`

This ensures that whether there are 0 or 3 performers, the card always fills the sidebar height cleanly.
