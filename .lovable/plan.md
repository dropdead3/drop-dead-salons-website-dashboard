

## Add Closed-Day Awareness to Forecast Chart X-Axis Labels

### What Changes

The forecast chart's x-axis labels (under each bar) will show a "Closed" indicator on days where the selected location is closed -- based on the location's `hours_json` and `holiday_closures` data. If there are still appointments booked on a closed day, the appointment count will still display (with the closed badge alongside it).

### Behavior

| Scenario | X-axis label shows |
|----------|-------------------|
| Open day, 15 appointments | `Thu` / `Feb 19` / `15 appointments` |
| Closed day, 0 appointments | `Sun` / `Feb 22` / moon icon + `Closed` |
| Closed day, 2 appointments | `Sun` / `Feb 22` / `2 appointments` + moon icon + `Closed` |
| Location = "All Locations" | No closed-day logic (cannot determine closure across multiple locations) |

### Technical Details

**1. `src/components/dashboard/sales/WeekAheadForecast.tsx`**

- Import `useActiveLocations`, `isClosedOnDate` from `useLocations`
- Fetch locations list via `useActiveLocations()`
- Find the selected location object when `selectedLocation !== 'all'`
- For each day in the chart, compute whether that location is closed using `isClosedOnDate(loc.hours_json, loc.holiday_closures, parseISO(day.date))`
- Pass a `closedDates` set (or map with reasons) to `CustomXAxisTick`
- In `CustomXAxisTick`: if the day is closed and has 0 appointments, show a moon icon + "Closed" text (matching `ClosedBadge` styling). If closed but has appointments, show the appointment count plus a small "Closed" label underneath.

**2. `src/components/dashboard/sales/ForecastingCard.tsx`**

- Same approach: import `useActiveLocations`, `isClosedOnDate`
- Compute closed dates based on `selectedLocation`
- Pass `closedDates` to `DailyXAxisTick`
- Update `DailyXAxisTick` to render the closed indicator (same logic as above)
- Weekly chart ticks (`WeeklyXAxisTick`) are unaffected since they aggregate across multiple days

**3. SVG rendering approach for X-axis tick closed indicator**

Since these are SVG `<text>` elements inside Recharts custom ticks, the moon icon will be rendered as a small SVG circle or unicode character rather than importing the Lucide component. The text styling will use `fill-muted-foreground` and smaller font size (`text-[9px]`) to match the existing `ClosedBadge` aesthetic.

### Files Modified

| File | Action |
|------|--------|
| `src/components/dashboard/sales/WeekAheadForecast.tsx` | Add location lookup, compute closed dates, update `CustomXAxisTick` |
| `src/components/dashboard/sales/ForecastingCard.tsx` | Add location lookup, compute closed dates, update `DailyXAxisTick` |

No new files or database changes needed.

