

## Show Exact Dollar Amount on Week Ahead Forecast Card

### What changes

The simplified "Week Ahead Forecast" pinned card currently displays a compact/rounded value like "$6K". This will be changed to show the exact whole-dollar amount (e.g., "$6,240") and update the subtitle to reflect the more precise language.

### Change

In `src/components/dashboard/PinnedAnalyticsCard.tsx` (line 426-427), replace:

```
metricValue = formatCurrencyCompact(weekAheadData?.totalRevenue ?? 0);
metricLabel = 'Projected revenue for the next 7 days';
```

with:

```
metricValue = formatCurrencyWhole(weekAheadData?.totalRevenue ?? 0);
metricLabel = 'Estimated booked service revenue for the next 7 days';
```

`formatCurrencyWhole` is already imported and available on the same line (279) as `formatCurrencyCompact`, so no new imports are needed.

### Technical detail

Single two-line change in `PinnedAnalyticsCard.tsx`. No other files affected. The `formatCurrencyWhole` formatter outputs full dollar amounts with no decimal places (e.g., "$6,240" instead of "$6K").

