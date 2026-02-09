

# Fix Duplicate "Today"/"Tomorrow" Labels

## Problem
The `DailyXAxisTick` component looks up day data using:
```
days.find(d => d.dayName === payload.value)
```
Since `payload.value` comes from `dataKey="name"` which is set to `day.dayName` (e.g., "Mon", "Tue"), when there are multiple weeks of data, **every Monday matches the same first Monday** in the `days` array. If that first Monday is today's date, then all Mondays get labeled "Today".

## Fix

**File: `src/components/dashboard/sales/ForecastingCard.tsx`**

1. **Use `day.date` as the chart data key** instead of `day.dayName`:
   - Change `dailyChartData` mapping: `name: day.date` (unique per bar)
   - This ensures each bar has a unique identifier

2. **Update `DailyXAxisTick`** to look up by date instead of day name:
   - Change `days.find(d => d.dayName === payload.value)` to `days.find(d => d.date === payload.value)`
   - The date comparison for Today/Tomorrow already works correctly once the lookup is fixed

3. **Update `ForecastTooltip`** (if it also matches by `dayName`) to use the date-based lookup as well, so tooltip content stays correct.

This is a one-line root-cause fix (the `name` field in chart data) plus updating the find calls to match by `.date` instead of `.dayName`. The `getDisplayLabel()` function will then correctly show the day abbreviation for non-today/tomorrow dates using `day.dayName`.

