

# Fix Sidebar Cards: Overflow & Sizing

## Problem
The "Top Performers" and "Revenue Breakdown" cards in the sidebar are oversized because:
1. `CardTitle` defaults to `text-2xl` -- way too large for a narrow sidebar column
2. `CardHeader` defaults to `p-6` padding -- excessive for compact cards
3. The cards have no `overflow-hidden`, so content can spill out visually

## Changes

### 1. `src/components/dashboard/sales/TopPerformersCard.tsx`
- Change `CardTitle` from `text-base` to `text-sm` for a tighter header
- Add `p-4` to `CardHeader` and `CardContent` to reduce internal padding
- Add `overflow-hidden` to the root `Card`

### 2. `src/components/dashboard/sales/RevenueDonutChart.tsx`
- Same treatment: `text-sm` title, `p-4` padding on header/content
- Add `overflow-hidden` to the root `Card`

### 3. `src/components/dashboard/AggregateSalesCard.tsx`
- Add `overflow-hidden` to the sidebar card wrappers
- Ensure the sidebar column itself has `min-w-0` to prevent grid blowout

These are purely CSS class changes -- no logic modifications needed.
