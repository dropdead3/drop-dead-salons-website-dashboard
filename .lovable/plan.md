

## Pass metricData to PinnableCard Wrappers in Command Center

### What Changes

**File: `src/components/dashboard/PinnedAnalyticsCard.tsx`**

Add `metricData`, `dateRange`, and `locationName` props to each `PinnableCard` wrapper using data already available in the component. No new hooks or API calls needed.

### Per-Card metricData Mapping

Using data already fetched by the existing hooks (`useSalesMetrics`, `useSalesByStylist`, `useStaffUtilization`) plus the `filters` object:

| Card | metricData source |
|---|---|
| `sales_overview` | `salesData` -- Total Revenue, Service Rev, Product Rev, Avg Ticket |
| `top_performers` | `performers` -- Top 5 names + revenue amounts |
| `revenue_breakdown` | `salesData` -- serviceRevenue, productRevenue split |
| `team_goals` | `salesData` -- currentRevenue vs target |
| `new_bookings` | None (card fetches its own data internally; edge function DB fallback handles it) |
| `week_ahead_forecast` | None (card fetches its own data internally) |
| `capacity_utilization` | None (card fetches its own data internally) |
| `client_funnel` | None (card fetches its own data internally) |
| `operations_stats` | None (card fetches its own data internally) |
| `hiring_capacity` | None (no metrics available at this level) |
| `staffing_trends` | None (no metrics available at this level) |
| `stylist_workload` | `workload` -- staff names + booked hours/utilization |

All PinnableCard wrappers will also receive:
- `dateRange={filters.dateRange}` -- so Zura knows the time window
- `locationName` -- resolved from a location lookup or passed as the filter label

### Technical Details

- For cards where metric data is available from existing hooks, we build a `Record<string, string | number>` inline and pass it. Example:

```
metricData={{
  "Total Revenue": salesData?.totalRevenue || 0,
  "Service Revenue": salesData?.serviceRevenue || 0,
  "Product Revenue": salesData?.productRevenue || 0,
}}
```

- For cards where the component fetches its own data internally (like `NewBookingsCard`, `ForecastingCard`), we skip `metricData`. The edge function's DB fallback will query the data directly using the `cardName` -- this already works today.

- We'll need to resolve the location name from the `filters.locationId`. The component can either:
  - Use a lightweight `useLocationName(filters.locationId)` hook (if one exists), or
  - Pass the locationId and let the edge function resolve it (which it already does via `locationName`)

- This is a single-file change to `PinnedAnalyticsCard.tsx` with no new dependencies.

