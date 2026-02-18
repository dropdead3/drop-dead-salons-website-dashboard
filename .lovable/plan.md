

## Improve Service Category Mix Card Layout

### What Changes

The current card uses `grid lg:grid-cols-2` which splits the donut chart and the table 50/50. The table has 7 columns and needs more horizontal space while the donut chart only needs enough room to render clearly.

### Layout Update

1. **Change grid ratio** from equal `lg:grid-cols-2` to weighted columns: `lg:grid-cols-[minmax(180px,1fr)_3fr]` -- giving roughly 25% to the donut and 75% to the table

2. **Make donut responsive** -- remove the fixed `h-64` and instead use `aspect-square w-full max-w-[280px] mx-auto` so it scales naturally within its column and stays centered

3. **Ensure mobile stacking** -- on small screens the grid collapses to a single column (donut on top, table below) which already works with the `lg:` prefix

### Technical Details

**File: `src/components/dashboard/analytics/ServicesContent.tsx`**

- Line 366: Change `grid lg:grid-cols-2 gap-6` to `grid lg:grid-cols-[minmax(180px,1fr)_3fr] gap-6 items-start`
- Line 367: Change `h-64` to `aspect-square w-full max-w-[280px] mx-auto` for a responsive donut that fills its column
- Add `overflow-x-auto` wrapper on the table column so on mid-size screens the table can scroll horizontally if needed

No data or logic changes -- purely a layout/sizing adjustment.
