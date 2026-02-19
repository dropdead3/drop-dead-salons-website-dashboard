

## Fix Week Ahead Forecast Card to Show Real 7-Day Revenue

### Problem

The compact "Week Ahead Forecast" tile permanently shows "--" with "loading" because it relies on `useRevenueForecast` (which calls a `revenue-forecasting` edge function). That edge function either does not exist or is not returning data. Meanwhile, the actual appointment-based 7-day revenue data is readily available via the `useWeekAheadRevenue` hook, which queries `phorest_appointments` directly and works reliably.

### Fix (single file: `PinnedAnalyticsCard.tsx`)

| Change | Detail |
|--------|--------|
| Swap data source | Replace `useRevenueForecast` with `useWeekAheadRevenue` for the compact metric extraction |
| Update metric logic | Use `weekAheadData.totalRevenue` (real booked revenue) instead of `forecastData.summary.totalPredicted` |
| Better loading state | Show "--" only while `isLoading` is true; once loaded, display the formatted currency value even if zero |
| Clean up unused import | Remove `useRevenueForecast` import if no other card references it |

### Updated Metric Extraction

```tsx
// Line ~288: Replace useRevenueForecast with useWeekAheadRevenue
const { data: weekAheadData, isLoading: weekAheadLoading } = useWeekAheadRevenue(locationFilter);

// Line ~420-428: Update the case
case 'week_ahead_forecast': {
  if (weekAheadLoading) {
    metricValue = '--';
    metricLabel = 'loading';
  } else {
    metricValue = formatCurrencyCompact(weekAheadData?.totalRevenue ?? 0);
    metricLabel = '7-day revenue';
  }
  break;
}
```

### Why This Works

`useWeekAheadRevenue` queries `phorest_appointments` for the next 7 days directly via the database -- no edge function dependency. It already powers the full "Week Ahead Forecast" card in detailed view, so the compact tile will show the same number.

One file modified. No database changes.
