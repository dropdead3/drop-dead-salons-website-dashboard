
## Enhance "Busiest Day" Callout with Day + Date and Period-Aware Label

### What Changes

The "Busiest day" callout currently shows only the day name (e.g., "Wednesday"). This update will:

1. Show both the day name and the date (e.g., "Wednesday, Feb 19")
2. Add context that it's the busiest day of the forecast period (e.g., "Busiest day of the next 7 days")
3. Adapt the label for each time range filter (7 days, 30 days, 60 days, Today to EOM)
4. Apply the same logic to the "Busiest week" callout for weekly chart periods

### Updated Display

| Period | Current | After |
|--------|---------|-------|
| 7 days | Busiest day: **Wednesday** | Peak day (next 7 days): **Wednesday, Feb 19** |
| 30 days | Busiest day: **Wednesday** | Peak day (next 30 days): **Wednesday, Feb 19** |
| 60 days | Busiest week: **Week of Mar 3** | Peak week (next 60 days): **Week of Mar 3** |
| Today to EOM | (hidden currently -- remains hidden) | -- |
| WeekAheadForecast | Busiest day: **Wednesday** | Peak day (next 7 days): **Wednesday, Feb 19** |

### Technical Details

**`src/components/dashboard/sales/WeekAheadForecast.tsx`** (line ~542)

- Change the date format from `'EEEE'` (day name only) to `'EEEE, MMM d'` (day name + short date)
- Update label from "Busiest day:" to "Peak day (next 7 days):"

**`src/components/dashboard/sales/ForecastingCard.tsx`** (lines ~959-978)

- Add a period-aware label map:
  - `'7days'` -> `"Peak day (next 7 days)"`
  - `'30days'` -> `"Peak day (next 30 days)"`
  - `'60days'` -> `"Peak week (next 60 days)"`
- Change the date format from `'EEEE'` to `'EEEE, MMM d'` for daily view
- Update "Busiest week:" to use the same period-aware pattern for the weekly chart callout

### Files Modified
- `src/components/dashboard/sales/WeekAheadForecast.tsx`
- `src/components/dashboard/sales/ForecastingCard.tsx`
