

## ✅ Add Closed-Day Awareness to Capacity Utilization (COMPLETED)

Both hooks (`useCapacityUtilization.ts` and `useHistoricalCapacityUtilization.ts`) now detect closed days via `isClosedOnDate()` and set `isClosed: true` on `DayCapacity`. Closed days are excluded from summary stats. Both UI cards render moon icon + "Closed" label in x-axis, suppress bar rendering and percentage labels, and show a "Closed Tomorrow" state in the single-day view.
