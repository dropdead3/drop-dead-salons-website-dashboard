

## Multi-Select Location Filter for Analytics

### What Changes

Replace the single-select location dropdown with a multi-select checkbox popover when 3 or more locations exist. This lets users pick exactly which locations they want analytics for (e.g., select 3 out of 10). When there are only 1-2 locations, the current single-select behavior remains unchanged.

### User Experience

```text
When 1-2 locations:   Current single-select dropdown (no change)

When 3+ locations:

  [ Location Filter (3 of 10) v ]      [ Today v ]

  Popover opens:
  +----------------------------------+
  | [x] Select All                   |
  |----------------------------------|
  | [x] North Mesa                   |
  | [x] Val Vista Lakes              |
  | [x] Gilbert                      |
  | [ ] Scottsdale                   |
  | [ ] Chandler                     |
  | ...                              |
  +----------------------------------+
```

- "Select All" checkbox at the top toggles all on/off
- Trigger label shows "All Locations" when all selected, or "X of Y Locations" when a subset is selected
- Single location selected shows that location's name directly
- Deselecting all automatically re-selects all (cannot have zero selections)

### Backward Compatibility Strategy

Currently `locationId` is a `string` used in 65+ hooks with the pattern:
```ts
if (locationId && locationId !== 'all') query = query.eq('location_id', locationId);
```

To avoid touching all 65 hooks, the approach:

1. Keep `locationId: string` in the `AnalyticsFilters` interface
2. Encode multi-select as a **comma-separated string** (e.g. `"uuid1,uuid2,uuid3"`)
3. Create a shared utility `applyLocationFilter(query, locationId)` that:
   - `'all'` or empty: no filter applied
   - Single UUID: `.eq('location_id', id)`
   - Comma-separated: `.in('location_id', ids)`
4. Migrate hooks **incrementally** -- start with the hooks used by pinned dashboard cards, then expand to Analytics Hub and other pages in a follow-up

### Technical Details

**New file: `src/components/ui/location-multi-select.tsx`**
- A Popover-based multi-select component with checkboxes
- Props: `locations`, `selectedIds`, `onSelectionChange`, `canViewAggregate`
- Uses Popover + Command or simple checkbox list
- "Select All" toggle at the top
- Trigger displays contextual label

**New file: `src/lib/locationFilter.ts`**
- `applyLocationFilter(query, locationId)` utility
- `parseLocationIds(locationId: string): string[]` helper
- `encodeLocationIds(ids: string[]): string` helper
- `isAllLocations(locationId: string): boolean` helper

**Modified: `src/components/dashboard/AnalyticsFilterBar.tsx`**
- Import `LocationMultiSelect`
- Conditionally render multi-select (3+ locations) vs single-select (1-2 locations)
- The `onLocationChange` callback still passes a string (either `'all'`, a single UUID, or comma-separated UUIDs)

**Modified: `src/pages/dashboard/DashboardHome.tsx`**
- No state type changes needed (remains `string`)
- Works seamlessly since the encoding is transparent

**Modified (incremental): Key hooks**
- Replace `if (locationId && locationId !== 'all') query.eq(...)` with `applyLocationFilter(query, locationId)` in the most critical hooks first:
  - `useSalesData.ts`
  - `useWeekAheadRevenue.ts`
  - `useCapacityUtilization.ts`
  - `useRetailAttachmentRate.ts`
  - `useRebookingRate.ts`
  - `useStaffUtilization.ts`
- Remaining hooks can be migrated in follow-up passes -- they still work for single-location and all-locations selections

### Files

- **New:** `src/components/ui/location-multi-select.tsx`
- **New:** `src/lib/locationFilter.ts`
- **Modified:** `src/components/dashboard/AnalyticsFilterBar.tsx`
- **Modified:** Key analytics hooks (6-8 files, replacing `.eq` with `applyLocationFilter`)

