

## Add Closed-Day Awareness to Capacity Utilization

### What's Changing

The Capacity Utilization card currently shows 0% bars with misleading "Full" labels for days when locations are closed (e.g., Sunday, Monday). Instead, closed days will show a moon icon with a "Closed" label -- no bar rendered -- matching the pattern already used in the forecasting charts.

### Data Layer Changes

**File: `src/hooks/useCapacityUtilization.ts`**

Add an `isClosed` boolean to the `DayCapacity` interface. During date initialization, use `isClosedOnDate()` to check each date against all filtered locations (or single location). A day is "closed" when every relevant location is closed on that date (same logic as forecasting cards). Closed days get `availableHours: 0` and `isClosed: true`.

Also exclude closed days from the summary stats (totalAvailableHours, totalGapHours, gapRevenue) so the utilization percentage and opportunity callout only reflect operating days.

### UI Changes

**Files: `src/components/dashboard/sales/CapacityUtilizationCard.tsx` and `src/components/dashboard/analytics/CapacityUtilizationSection.tsx`**

Both files get the same treatment:

1. **Custom X-axis tick** (`DayXAxisTick`): When a day is closed, show the day name plus a "Closed" label (with moon character) instead of "Xh open" / "Full".

2. **Bar label** (`UtilizationBarLabel`): Suppress the percentage label for closed days (don't show "0%").

3. **Bar rendering**: Use a custom `<Cell>` per bar. For closed days, set fill to `transparent` and stroke to `none` so no bar renders. In the empty space, render a small moon icon via a custom SVG reference shape positioned at the bar's x-axis center.

4. **Closed days moon icon**: Since Recharts bars can't render arbitrary JSX, the approach is to use a `customizedTick` or a Recharts `<ReferenceDot>` / custom shape. The simplest clean approach: render the moon symbol directly in the `DayXAxisTick` component (text element with the moon character, same as forecasting cards use).

5. **Tomorrow view**: If the single day is closed, show a "Closed" state instead of the utilization detail panel.

### Technical Summary

| Element | Before | After |
|---------|--------|-------|
| `DayCapacity` interface | No `isClosed` field | `isClosed: boolean` added |
| Closed day bar | Renders 0% bar with gradient | Transparent / no bar rendered |
| Closed day label | "0%" above bar | No label |
| Closed day x-axis | "Full" | Moon icon + "Closed" |
| Summary stats | Include closed days in gap hours | Exclude closed days |
| Tomorrow view (closed) | Shows 0% capacity | Shows "Closed" state with moon icon |

### Consistency

This mirrors the exact pattern used in `WeekAheadForecast.tsx` and `ForecastingCard.tsx`, which compute a `closedDates` Set and render "Closed" in their x-axis ticks. The capacity card will use the same `isClosedOnDate` utility and the same visual language.

