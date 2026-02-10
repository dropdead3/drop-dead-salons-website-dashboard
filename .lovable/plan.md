
# Unify All Bento Grid Spacing to gap-6

## Problem
Within the Sales Overview bento layout, the main grid columns use `gap-6` (24px), and the sidebar now also uses `gap-6`. However, the internal spacing within the left column still uses smaller, inconsistent values:
- Services/Products sub-cards: `gap-3 sm:gap-4`
- Secondary KPIs row: `gap-3 sm:gap-4` with `mt-4`
- Goal Progress section: `mt-4`

This creates uneven spacing between elements inside the bento grid.

## Solution
Standardize all internal gaps and margins within the bento layout to `gap-6` so every section breathes equally.

## Technical Details

### File: `src/components/dashboard/AggregateSalesCard.tsx`

Four changes, all within the left column of the main content grid:

1. **Line 434** - Services and Products sub-cards grid:
   - Change `gap-3 sm:gap-4` to `gap-6`

2. **Line 466** - Secondary KPIs row (Transactions, Avg Ticket, Rev/Hour):
   - Change `gap-3 sm:gap-4 mt-4` to `gap-6 mt-6`

3. **Line 516** - Goal Progress wrapper:
   - Change `mt-4` to `mt-6`

These three changes ensure every visible gap between bento elements -- horizontally and vertically -- is a uniform 24px.
