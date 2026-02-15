

## Fill Top Performers Card to Match Sidebar Height

### Problem
The Top Performers card collapses to its content height when empty, leaving a large gap between it and the Revenue Breakdown card below. The parent container uses `flex-1` to distribute space, but the card itself no longer has `h-full` to fill that space.

### Solution
Re-add `h-full` to the Top Performers card in its **loading** and **populated** states, while keeping the empty state compact. This way, when data or skeletons are present the card stretches to fill the sidebar column, and when empty it stays tight (which only matters on mobile/stacked layout).

### Changes

**File: `src/components/dashboard/sales/TopPerformersCard.tsx`**

1. **Loading state card** (the skeleton variant): Add `h-full` back to the Card className.
2. **Populated state card** (the main return with performer rows): Add `h-full` back to the Card className.
3. **Empty state card**: Leave as-is (no `h-full`) so it stays compact when stacked.
