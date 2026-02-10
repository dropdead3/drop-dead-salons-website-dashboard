
# Equalize Spacing Between Sidebar Cards

## Problem
The main grid uses `gap-6` (24px) between columns, but the sidebar's internal gap between the Top Performers card and Revenue Breakdown card is only `gap-2` (8px). This creates an inconsistent, unbalanced look.

## Solution
Change the sidebar's vertical gap from `gap-2` to `gap-6` so it matches the grid's column gap, making all spacing in the bento layout uniform.

## Technical Details

### File: `src/components/dashboard/AggregateSalesCard.tsx`
- **Line 526**: Change `gap-2` to `gap-6`

Single class change:
```
Before: <div className="flex flex-col gap-2 min-w-0">
After:  <div className="flex flex-col gap-6 min-w-0">
```
