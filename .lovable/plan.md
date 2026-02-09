
# Fix "Today" / "Tomorrow" Label Logic

## Problem
The `DailyXAxisTick` component in `ForecastingCard.tsx` determines "Today" and "Tomorrow" labels using **array index position** (`dayIndex === 0` for Today, `dayIndex === 1` for Tomorrow). This is fragile and causes every Monday and Tuesday in the dataset to be incorrectly labeled as "Today" and "Tomorrow" when the `dayName` field matches multiple entries.

Similarly, `isToday` in chart data (line 412) uses `index === 0` rather than actual date comparison.

## Root Cause
The code at lines 169-172:
```tsx
const isTodayHighlight = isEomPeriod && dayIndex === 0;
const isTomorrowHighlight = (isEomPeriod && dayIndex === 1) || (is7DaysPeriod && dayIndex === 0);
```
...matches by position, not by date. The `DayForecast` objects have a `.date` string (e.g., `"2026-02-09"`) that should be compared against the actual current date.

## Fix

### File: `src/components/dashboard/sales/ForecastingCard.tsx`

1. **In `DailyXAxisTick`** (around lines 162-179): Replace index-based logic with date string comparison:
   - Compute `todayStr` and `tomorrowStr` using local date formatting (avoiding UTC timezone shift via `getFullYear()`/`getMonth()`/`getDate()`)
   - Compare `day.date === todayStr` for "Today" and `day.date === tomorrowStr` for "Tomorrow"
   - Remove the `dayIndex` variable entirely

2. **In `dailyChartData` mapping** (line 412): Replace `isToday: isEomPeriod && index === 0` with `isToday: day.date === todayStr` using the same local date formatting

### Date Formatting
To avoid the UTC timezone bug (where `toISOString()` can shift the date), we'll use local components:
```tsx
function toLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

## Technical Details

### Changes in `DailyXAxisTick`:
```tsx
function DailyXAxisTick({ x, y, payload, days, peakDate, onDayClick, isEomPeriod, is7DaysPeriod }: any) {
  const day = days.find((d) => d.dayName === payload.value);
  if (!day) return null;

  const now = new Date();
  const todayStr = toLocalDateStr(now);
  const tomorrowStr = toLocalDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));

  const isTodayHighlight = day.date === todayStr;
  const isTomorrowHighlight = day.date === tomorrowStr;

  const getDisplayLabel = () => {
    if (isTodayHighlight) return 'Today';
    if (isTomorrowHighlight) return 'Tomorrow';
    return day.dayName;
  };
  // ... rest unchanged
}
```

### Changes in chart data:
```tsx
const now = new Date();
const todayStr = toLocalDateStr(now);

const dailyChartData = days.map((day, index) => ({
  ...
  isToday: day.date === todayStr,
}));
```

### Also check `WeekAheadForecast.tsx`
The `CustomXAxisTick` in `WeekAheadForecast.tsx` does NOT currently use Today/Tomorrow labels (it just shows `day.dayName`), so no changes needed there.

## Files to Edit
- `src/components/dashboard/sales/ForecastingCard.tsx` -- add helper function, fix DailyXAxisTick logic, fix dailyChartData isToday
