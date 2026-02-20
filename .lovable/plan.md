

## Update New Bookings Simplified Card Copy

### Changes

In `src/components/dashboard/PinnedAnalyticsCard.tsx` (lines 432-434), update the metric value suffix and label:

**Before:**
```
metricValue = `${formatNumber(count)} new`;
metricLabel = 'New bookings placed this period';
```

**After:**
```
metricValue = `${formatNumber(count)} added`;
metricLabel = 'Appointments added to the schedule so far today';
```

### Details

- Single file change, two lines
- The metric value suffix changes from "NEW" to "ADDED" (the card renders this uppercase via font styling)
- The sublabel clarifies the filter context — these are today's additions to the schedule

