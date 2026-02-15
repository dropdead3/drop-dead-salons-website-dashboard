

## Responsive Sales Overview Card — Sidebar Reflow

### Problem
On smaller screens (below `lg` breakpoint), the Top Performers and Revenue Breakdown cards stack directly after the main revenue hero area, pushing the secondary KPIs and goal progress further down. This creates an awkward reading order where sidebar content interrupts the primary sales flow.

### Solution
Use Tailwind CSS `order` utilities so that on screens smaller than `lg`, the sidebar column (Top Performers + Revenue Breakdown) reflows to the bottom of the Sales Overview card, after the Location section. On `lg` and above, the current 3-column side-by-side layout is preserved.

### What changes

**File: `src/components/dashboard/AggregateSalesCard.tsx`**

1. On the main content grid (line 530), change from `grid lg:grid-cols-3` to include ordering:
   - Keep `grid lg:grid-cols-3 gap-6 mb-6`

2. On the KPI column (line 532, `lg:col-span-2`), add `order-1` so it always comes first.

3. On the sidebar column (line 936), add `order-3 lg:order-2` so it appears last on mobile but in its normal position on desktop.

4. Move the "By Location" section (currently outside the grid, starting at line 953) inside the grid with `order-2 lg:order-3 lg:col-span-3` — or alternatively, keep it outside and restructure the sidebar ordering.

**Simpler approach:** Since the By Location section is outside the grid, we only need to reorder within the grid:
- KPI column: `order-2 lg:order-1 lg:col-span-2` (stays first on desktop, second on mobile after... wait, we want KPIs first always)
- Actually the simplest fix: sidebar column gets `order-last lg:order-none` — this pushes it to the bottom on mobile while keeping its natural grid position on desktop.

### Technical detail

Two class changes in `AggregateSalesCard.tsx`:

1. **Line 532** (KPI column): No change needed, it naturally comes first.
2. **Line 936** (sidebar column): Change from `flex flex-col gap-6 min-w-0` to `flex flex-col gap-6 min-w-0 order-last lg:order-none`. This uses `order-last` to push the sidebar below the KPI content on small screens, and `lg:order-none` to restore the natural grid position on desktop.

No other files need changes. The By Location section sits outside the grid so it naturally appears after both columns regardless.

