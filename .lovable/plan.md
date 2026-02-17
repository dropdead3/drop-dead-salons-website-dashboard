

## Make Pace Tracker Always Use Operating Days (Not Calendar Days)

### The Problem

The "$2,107/day needed" calculation on the Monthly Goal currently divides the remaining revenue by **total calendar days** remaining when viewing "All Locations." This includes Sundays and Mondays (when all locations are closed), inflating the number of days and producing an artificially low daily rate. It also omits the "(X open days left)" context label, so there's no way to tell what the number is based on.

### The Fix

When "All Locations" is selected, compute operating days the same way we did for the forecast closed-day indicators: a day counts as "closed" only if **every** active location is closed. Then pass the resulting `hoursJson`-equivalent data down so the pace calculation uses open business days.

### What Changes

**1. `src/components/dashboard/AggregateSalesCard.tsx`**

When `isAllLocations` is true, compute a merged/synthetic `hoursJson` where a day is marked closed only if all locations are closed on that day. Pass this merged schedule to `GoalProgressWithOwnRevenue` so the pace tracker always gets operating-day awareness.

```text
Before:  hoursJson={selectedLoc?.hours_json}          // undefined for "all"
After:   hoursJson={selectedLoc?.hours_json ?? mergedHoursJson}  // fallback to merged
```

The merged `hoursJson` will be computed in a `useMemo`:
- For each weekday (sunday-saturday), check if every location has `closed: true`
- If all locations are closed on that day, mark it closed in the merged object

Similarly, merge `holidayClosures`: a date is a holiday only if every location lists it.

**2. `src/components/dashboard/sales/SalesGoalProgress.tsx`**

Update the "Behind pace" display to **always** show the open days context -- not just when `isLocationAware` is true. This ensures clarity regardless of how the data arrives.

```text
Before:  Behind pace . $2,107/day needed (11 open days left)   // only when single location
After:   Behind pace . $2,107/day needed (11 open days left)   // always shown
```

**3. `src/pages/dashboard/admin/SalesDashboard.tsx`**

Apply the same merged hours logic for the SalesDashboard page's goal progress component (same pattern as AggregateSalesCard).

### Result

| View | Before | After |
|------|--------|-------|
| All Locations | Behind pace . $2,107/day needed | Behind pace . $2,904/day needed (8 open days left) |
| Single Location | Behind pace . $2,107/day needed (8 open days left) | No change (already correct) |

The daily rate will increase (correctly) because the denominator shrinks from ~11 calendar days to ~8 open business days, giving a more realistic and actionable target.

### Files Modified

| File | Change |
|------|--------|
| `src/components/dashboard/AggregateSalesCard.tsx` | Add merged hoursJson/holidayClosures useMemo for "All Locations" |
| `src/pages/dashboard/admin/SalesDashboard.tsx` | Same merged hours logic |
| `src/components/dashboard/sales/SalesGoalProgress.tsx` | Always show "(X open days left)" in pace indicator |
