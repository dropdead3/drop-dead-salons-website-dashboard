

## Clarify "Next 7 Days" Excludes Today

### Problem
The Week Ahead Forecast card shows "$6,441 — Estimated booked service revenue for the next 7 days," but the underlying data starts tomorrow (day +1 through day +7), not today. The label should make this explicit.

### Change

In `src/components/dashboard/PinnedAnalyticsCard.tsx` (line ~427), update the metric label:

**Before:**
```
metricLabel = 'Estimated booked service revenue for the next 7 days';
```

**After:**
```
metricLabel = 'Estimated booked service revenue for the next 7 days (excludes today)';
```

### Technical detail

Single-line string change. No logic or data changes needed — the hook already correctly fetches tomorrow through day +7.

