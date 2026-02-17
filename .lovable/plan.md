

## Fix Closed-Day Detection for "All Locations" View

### The Problem

The closed-day logic currently skips entirely when `selectedLocation === 'all'` (which is the default). It returns an empty `Set`, so no days ever show the "Closed" indicator. Since you're viewing "All Locations", Sunday and Monday just show "0 appointments" with no context.

### The Fix

When `selectedLocation === 'all'`, compute closed dates by checking **all** locations: a date is marked closed only if **every** location is closed on that day. This correctly identifies universally closed days (e.g., all locations closed on Sundays and Mondays).

### Logic Change

```text
Before:
  if (selectedLocation === 'all') return empty set  // always skips

After:
  if (selectedLocation === 'all') {
    for each day:
      if EVERY location reports isClosed → mark as closed
  } else {
    // existing single-location logic (unchanged)
  }
```

### Files Modified

| File | Change |
|------|--------|
| `src/components/dashboard/sales/WeekAheadForecast.tsx` | Update `closedDates` useMemo to check all locations when `selectedLocation === 'all'` |
| `src/components/dashboard/sales/ForecastingCard.tsx` | Same update to `closedDates` useMemo |

### Edge Cases

- If there's only 1 location, "All Locations" behaves identically to selecting that location
- If locations have different closed days (e.g., Location A closed Sunday, Location B open Sunday), Sunday will NOT be marked closed -- correct behavior since some business is open
- If no locations are loaded yet, returns empty set (no false positives)
