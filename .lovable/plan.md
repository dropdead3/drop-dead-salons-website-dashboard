

## Complete Compact View Coverage for All Pinnable Analytics Cards

### Problem

The compact/simple view toggle was added, but only ~10 cards show real metrics. The remaining ~12 cards fall through to a default case showing "---" with no meaningful data. Every pinnable card needs a real primary metric in simple view.

### Cards Currently Missing Real Compact Metrics

| Card | What It Should Show | Data Source |
|------|---------------------|-------------|
| operational_health | Overall health score | Needs `useOperationalHealth` or internal calculation |
| locations_rollup | Location count + top location | Already has `accessibleLocations` |
| service_mix | Top category name + revenue | Add `useServiceMix` hook call |
| client_funnel | Total unique clients | Add `useClientFunnel` hook call |
| client_health | Clients needing attention | Add `useClientHealthSegments` hook call |
| goal_tracker | Org progress % | Add `useGoalTracker` or revenue vs goal |
| week_ahead_forecast | Projected revenue | Already has sales data to approximate |
| new_bookings | Booking count today | Add `useNewBookings` hook call |
| hiring_capacity | Open chairs / total | Add `useHiringCapacity` hook call |
| staffing_trends | Active staff count | Already has `workload` data |
| stylist_workload | Avg utilization % | Already has `workload` data (same as capacity but labeled differently) |
| client_experience_staff | (fallback) | Card name only if no data available |

### Implementation

**Single file change: `src/components/dashboard/PinnedAnalyticsCard.tsx`**

1. Add hook imports at the top:
   - `useServiceMix` from `useSalesData`
   - `useClientFunnel` from `useSalesAnalytics`
   - `useClientHealthSegments` from `useClientHealthSegments`
   - `useNewBookings` from `useNewBookings`
   - `useHiringCapacity` from `useHiringCapacity`

2. Call each hook alongside the existing hooks (before any conditional returns) with the same filter parameters already in scope (`filters.dateFrom`, `filters.dateTo`, `locationFilter`).

3. Expand the compact `switch` statement to map every card to a real metric:

```
operational_health  -> "Healthy" or score from child data (fallback: location count)
locations_rollup    -> "{N} locations" from accessibleLocations
service_mix         -> Top category name + revenue amount
client_funnel       -> "{N} total clients" (new + returning)
client_health       -> "{N} need attention" from segments
goal_tracker        -> Revenue vs goal progress %
week_ahead_forecast -> "Projected" + forecasted revenue
new_bookings        -> "{N} new" booking count
hiring_capacity     -> "{N} open chairs"
staffing_trends     -> "{N} active staff"
stylist_workload    -> Avg utilization % (reuse workload data)
client_experience_staff -> Card name (graceful fallback)
```

4. Remove the `default: '---'` fallback -- replace with card name display so no card ever shows a meaningless dash.

### What Stays the Same

- The toggle button in the filter bar (already implemented)
- The compact card layout (slim 56px row with icon, label, metric)
- The PinnableCard hover interaction (Zura AI + pin icons)
- The widgets section (untouched)
- All detailed view rendering (untouched)

### Technical Notes

- All new hooks are called unconditionally at the top of the component (React rules of hooks), but their data is only consumed inside the `if (compact)` block
- Hook calls with `locationFilter` and date range params ensure compact metrics respect the active filters
- `useHiringCapacity` takes no params (it's org-wide)
- Performance impact is minimal since these hooks use React Query caching and most are already called by child components when in detailed view

One file modified. No database changes.

