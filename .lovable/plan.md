

## Add Clarity to "Daily Operating Avg" Hover Hint

### Current State

A small info icon (MetricInfoTooltip) already exists next to the "Daily Operating Avg" label, but the tooltip text is formulaic (e.g., "7-Day Total / 5 operating days"). The user wants a clearer, plain-language explanation that this metric only counts days when the business is open.

### The Fix

Update the tooltip descriptions in both forecasting components to use friendlier, clearer language:

**Before:**
> "7-Day Total / 5 operating days. Average projected daily revenue excluding closed days."

**After:**
> "Average daily revenue calculated using only days your business is open. Closed days (like Sundays and Mondays) are excluded so the number reflects your actual daily earning pace."

### Files Modified

| File | Change |
|------|--------|
| `src/components/dashboard/sales/ForecastingCard.tsx` | Update `avgTooltip` text for `7days` and `todayToEom` periods |
| `src/components/dashboard/sales/WeekAheadForecast.tsx` | Update `MetricInfoTooltip` description on the Daily Operating Avg stat card |

Two small string changes, no logic changes needed.

