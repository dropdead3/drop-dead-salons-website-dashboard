

# Add Location & Region Filters to Service/Product Drill-Down

## Why This Matters

Multi-location organizations can generate 1,000+ services in a period. Without filtering, the drill-down becomes an overwhelming wall of stylist rows. Adding compact filters inside the dialog lets owners quickly scope to a specific region or location without leaving the view.

## What Changes

### 1. Add filter controls inside `ServiceProductDrilldown.tsx`

A compact filter row between the header and the stylist list:

```text
+-----------------------------------------------+
|  SERVICES BY STYLIST                    [X]    |
|  Revenue & retail-to-service ratio             |
+-----------------------------------------------+
|  [All]  [Region v]  [Location v]               |
+-----------------------------------------------+
|  [Avatar] Sarah M.                     $620    |
|  ...                                           |
+-----------------------------------------------+
```

- **Three filter states**: "All" (default), filter by region (state/province), filter by specific location
- Uses the existing `LocationSelect` component pattern and a simple Select for regions
- Compact: single row of small selects, no wasted space
- Filters are local to the dialog -- they don't affect the parent dashboard filters

### 2. Update `useServiceProductDrilldown` hook

- Add `locationId` to the query (already supported) but also accept an array or let the component filter client-side
- Since the hook already filters by `locationId`, the simplest approach is to let the dialog manage its own `locationId` state and pass it down, re-triggering the query when the filter changes
- For region filtering: fetch the location list, filter to locations in the selected region, then pass those location IDs to filter appointments

### 3. Update `ServiceProductDrilldown` props and state

- Add internal state: `filterLocationId` (defaults to the parent's `locationId` or `'all'`)
- Add internal state: `filterRegion` (defaults to `'all'`)
- The component fetches locations via `useActiveLocations()` to populate the dropdowns
- When a region is selected, only locations in that region show in the location dropdown
- The hook re-queries with the selected location filter

### 4. Apply same pattern to `NewBookingsDrilldown`

For consistency, add the same compact filter row to the New Bookings drill-down as well, since that will also scale with multi-location organizations.

## Technical Details

| File | Change |
|---|---|
| `src/components/dashboard/ServiceProductDrilldown.tsx` | Add filter row with region + location selects, manage local filter state, call hook with local locationId |
| `src/hooks/useServiceProductDrilldown.ts` | Minor: accept optional `locationIds` array for region-based filtering (OR keep single locationId and let component manage) |
| `src/components/dashboard/NewBookingsDrilldown.tsx` | Same filter row pattern for consistency |
| `src/hooks/useNewBookings.ts` | Ensure locationId param is respected in the staff breakdown queries |

## UX Details

- Filters render as small, inline Select dropdowns (matching existing Zura styling)
- Region dropdown only appears if the organization has locations in multiple states/regions
- Changing a filter instantly re-fetches and re-renders the stylist list
- "All" is always the default, showing the full picture first
- The filter state resets when the dialog closes

