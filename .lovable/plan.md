
# Fix Revenue Breakdown Card Height

## Problem
The Revenue Breakdown card uses `h-full` on its outer `Card`, which forces it to stretch to match the tallest card in its grid row. Since this card has minimal content (donut chart + 4 metric rows), there's a large empty space below.

## Solution
Remove `h-full` from the Card wrapper in `RevenueDonutChart.tsx` so the card naturally fits its content height.

## Technical Change

**File: `src/components/dashboard/sales/RevenueDonutChart.tsx`**
- Line 59 (empty state card): Change `h-full` to auto height
- Line 66 (main card): Change `h-full` to auto height

Both the empty-state and data-state Card elements use `className="overflow-hidden border-border/40 h-full"` -- the `h-full` will be removed from both so the card collapses to fit its content regardless of sibling card heights.

One small change, clean result.
