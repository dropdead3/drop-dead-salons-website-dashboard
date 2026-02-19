

## Wire Live Session Indicator to Location Filter

The "In Session" indicator currently fetches all active appointments across all locations. It needs to respect the same location filter used by the analytics cards on the dashboard.

### What Changes

**1. Update hook: `src/hooks/useLiveSessionSnapshot.ts`**

- Accept an optional `locationId` parameter (same encoding as the rest of the app: `'all'`, single UUID, or comma-separated UUIDs)
- Use the shared `applyLocationFilter` utility from `src/lib/locationFilter.ts` to add `.eq('location_id', id)` or `.in('location_id', ids)` to both appointment queries (active sessions and all-today)
- Include `locationId` in the `queryKey` so React Query refetches when the filter changes

**2. Update component: `src/components/dashboard/LiveSessionIndicator.tsx`**

- Accept a `locationId` prop
- Pass it through to `useLiveSessionSnapshot(locationId)`
- Pass it through to `LiveSessionDrilldown` as well (for consistency)

**3. Update page: `src/pages/dashboard/DashboardHome.tsx`**

- Pass `analyticsFilters.locationId` to `<LiveSessionIndicator locationId={...} />` in both render locations (compact and detailed mode, lines ~734 and ~804)

### What Does NOT Change

- The drilldown dialog content and behavior
- Demo mode logic (demo data is unfiltered mock data)
- The location filter bar itself
- Any other hooks or components

### Technical Details

Three files modified, zero database changes.

| File | Change |
|------|--------|
| `src/hooks/useLiveSessionSnapshot.ts` | Add `locationId` param, apply filter to queries, update query key |
| `src/components/dashboard/LiveSessionIndicator.tsx` | Accept + forward `locationId` prop |
| `src/pages/dashboard/DashboardHome.tsx` | Pass `analyticsFilters.locationId` to indicator (2 spots) |
