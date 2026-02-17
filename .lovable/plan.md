

## Update Daily Average to "Daily Operating Average"

### The Problem

The "Daily Avg" reference line and stat card divides total revenue by **all calendar days** (including closed days like Sunday and Monday). This produces an artificially low average since closed days with $0 revenue drag the number down.

### The Fix

Recalculate the daily average in the component layer using the already-computed `closedDates` set to divide total revenue by only **operating days**. Rename the label from "Daily Avg" to "Daily Operating Avg" for clarity.

### Example

| Metric | Before | After |
|--------|--------|-------|
| Total Revenue | $9,170 | $9,170 (unchanged) |
| Days in denominator | 7 | 5 (excluding Sun + Mon) |
| Daily Average | $1,310 | $1,834 |
| Label | "Daily Avg" | "Daily Operating Avg" |

### Changes

**1. `src/components/dashboard/sales/WeekAheadForecast.tsx`**

- Compute `operatingDailyAvg` using `closedDates`: `totalRevenue / (days.length - closedDates.size)` (with fallback to standard calculation if all days are somehow closed)
- Use `operatingDailyAvg` instead of `averageDaily` for the stat card value and the chart reference line position
- Rename label from "Daily Avg" to "Daily Operating Avg"
- Update the reference line badge text from "Daily Avg: $X" to "Daily Operating Avg: $X"
- Update tooltip from "7-Day Total / 7" to "7-Day Total / X operating days"

**2. `src/components/dashboard/sales/ForecastingCard.tsx`**

- Same operating-day-aware average calculation using `closedDates`
- Update `PERIOD_AVG_LABELS` entries from "Daily Avg" to "Daily Operating Avg" (for 'todayToEom' and '7days' periods)
- Update the chart reference line badge text
- Update tooltip descriptions to reflect operating days denominator

**3. `src/components/dashboard/sales/CategoryBreakdownPanel.tsx`**

- Update `MODE_LABELS.dailyAvg` from "Daily Avg by Category" to "Daily Operating Avg by Category"
- Update the corresponding dynamic label function

### Files Modified

| File | Change |
|------|--------|
| `src/components/dashboard/sales/WeekAheadForecast.tsx` | Compute operating-day avg, update labels and reference line |
| `src/components/dashboard/sales/ForecastingCard.tsx` | Compute operating-day avg, update labels and reference line |
| `src/components/dashboard/sales/CategoryBreakdownPanel.tsx` | Update "Daily Avg" labels |

No hook or database changes needed -- the calculation is done at the component level using the existing `closedDates` set.
