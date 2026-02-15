

## Fix Responsive Issues in Sales Overview Sidebar Cards

### Problems detected

From the screenshot at a medium viewport width (roughly tablet portrait), the sidebar column is too narrow before the `lg` breakpoint triggers `order-last`. This causes:

1. **Title truncation**: "TOP PERFORMERS" and "REVENUE BREAKDOWN" titles get clipped because the icon + title row doesn't wrap or scale.
2. **Excessive empty space**: The Top Performers card in its empty state stretches vertically with "No sales data available" centered in a large void.
3. **Label wrapping**: Revenue Breakdown labels like "Retail %" and "Attach Rate" wrap awkwardly in the cramped column.

### Solution

Since the sidebar already moves to the bottom via `order-last` below `lg`, the fix is to ensure the grid breaks to single-column **earlier** (at `md` instead of `lg`), and to tighten the sidebar cards for narrow contexts.

### Changes

**1. `src/components/dashboard/AggregateSalesCard.tsx`**
- Change the main grid from `lg:grid-cols-3` to `xl:grid-cols-3` so the 3-column layout only activates on wider screens.
- Update the KPI column from `lg:col-span-2` to `xl:col-span-2`.
- Update sidebar ordering from `order-last lg:order-none` to `order-last xl:order-none`.

This ensures the sidebar stacks below the KPIs at `md` and `lg` widths instead of being squeezed into a narrow column.

**2. `src/components/dashboard/sales/TopPerformersCard.tsx`**
- Remove `h-full` from the empty-state Card so it doesn't stretch to fill a tall flex container.
- Reduce empty-state padding from `py-3` to `py-2` for a more compact look.

**3. `src/components/dashboard/sales/RevenueDonutChart.tsx`**
- Add `truncate` to the title so it gracefully clips with an ellipsis if still constrained, rather than breaking layout.

### Why this approach

Changing the breakpoint from `lg` (1024px) to `xl` (1280px) for the 3-column layout means the sidebar only appears side-by-side when there's genuinely enough room. At tablet widths, both cards stack full-width below the KPIs, which is a much better reading experience. This is a minimal change (3 class swaps in one file, minor tweaks in 2 card files) that directly addresses the root cause.
