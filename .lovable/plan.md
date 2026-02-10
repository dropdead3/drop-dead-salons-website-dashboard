
# Rebalance Grid Columns for Bento Layout

## Problem
The current grid is `lg:grid-cols-4` with the left column spanning 3 of 4 (75%), leaving only 25% for the sidebar cards. This makes the right-side cards too narrow and cramped while the left column has excessive whitespace.

## Solution
Change the grid from a 4-column to a 3-column layout:
- Left column: `lg:col-span-2` (66%) -- narrower, tighter
- Right sidebar: 1 column (33%) -- wider, cards fit naturally

## Technical Details

### File: `src/components/dashboard/AggregateSalesCard.tsx`
- **Line 391**: Change `grid lg:grid-cols-4` to `grid lg:grid-cols-3`
- **Line 393**: Change `lg:col-span-3` to `lg:col-span-2`

Two class changes, no logic modifications.
