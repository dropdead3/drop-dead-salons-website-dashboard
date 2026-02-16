
# Week View: Start from Today

## Current Behavior
The week view starts with **yesterday** as the first column, then today, then 5 future days (7 total).

## Change
Start the week with **today** as the first column, followed by the next 6 consecutive days (7 total).

## Technical Detail
**File:** `src/components/dashboard/schedule/WeekView.tsx` (lines ~259-264)

Change:
```
const yesterday = addDays(today, -1);
const weekDays = Array.from({ length: 7 }, (_, i) => addDays(yesterday, i));
```
To:
```
const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, i));
```

Remove the `yesterday` variable and the `isYesterday` import since they are no longer needed. The `isYesterday` styling logic in the header can also be cleaned up.

One file, ~5 lines changed.
