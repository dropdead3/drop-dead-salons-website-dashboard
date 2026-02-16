

# Improve the "NA" Badge on Sales Overview

## Problem
The "NA" badge appears next to "SALES OVERVIEW" whenever total revenue is $0 or no data is returned. It is vague -- users don't know if it means "no data available," "locations are closed," or "no sales yet today." With the new closed-location indicators, this badge is partially redundant and can be made more informative.

## Solution
Replace the generic "NA" badge with contextual messaging:

1. **All locations closed**: Show "Closed" badge (leveraging the new `isClosedOnDate` helper). No ambiguity -- revenue is $0 because every location is closed.
2. **Some locations open, no revenue yet**: Show "No sales yet" -- signals that operations haven't started or no checkouts have occurred.
3. **Multi-day range with no data**: Show "No data" -- indicates no records exist for the selected period.
4. **Has revenue**: Show nothing (current behavior when `hasNoData` is false).

## File Changed
**`src/components/dashboard/AggregateSalesCard.tsx`**

- Import `isClosedOnDate` from `@/hooks/useLocations`
- Compute closure status for the viewed date (reuse the same logic already added for the closed-location banner lower in the card)
- Replace the static `"NA"` badge with conditional text:
  - If single-day view and all locations closed: badge shows "Closed"
  - If single-day view and some/no locations closed but no revenue: badge shows "No sales yet"
  - If multi-day range with no data: badge shows "No data"

## Technical Detail
```
// Pseudocode for the badge logic
if (!hasNoData) -> show nothing
else if (isSingleDay && allLocationsClosed) -> "Closed"
else if (isSingleDay) -> "No sales yet"
else -> "No data"
```

This is a small, isolated change within the card header rendering block (around lines 466-470). No other files affected.

