

# Fix: Make Bars Clickable (Not X-Axis Labels)

## Problem
The `onClick` on individual `<Cell>` elements in Recharts is unreliable -- clicks are landing on the X-axis day labels rather than the bars themselves. This is a known Recharts behavior where Cell-level click events don't always fire correctly in stacked bar charts.

## Solution
Replace the per-`Cell` `onClick` handlers with a single `onClick` on the `<BarChart>` component itself. Recharts passes the clicked bar's data in the event payload, which includes the `activeLabel` (day name) needed to identify the day.

## Technical Changes

**File: `src/components/dashboard/sales/WeekAheadForecast.tsx`**

1. Add `onClick` to the `<BarChart>` component:
   ```tsx
   <BarChart
     data={chartData}
     onClick={(state) => {
       if (state?.activeLabel) {
         handleBarClick(state.activeLabel);
       }
     }}
     style={{ cursor: 'pointer' }}
   >
   ```

2. Remove `onClick` and `cursor="pointer"` from all `<Cell>` elements (both the confirmed and unconfirmed Bar maps) -- keep only the visual styling (fill, opacity, stroke for selection state).

This is a minimal, targeted fix. No new components or hooks needed.
