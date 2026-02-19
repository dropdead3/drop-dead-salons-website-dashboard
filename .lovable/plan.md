
## Group Stylists by Location in "Happening Now" Drilldown

When "All Locations" is selected, the drilldown currently shows a flat list with no way to tell which location each stylist is at. This update adds location-aware grouping.

### Approach: Section Headers per Location

When the filter is set to "All Locations", stylists will be organized into sections with location name headers. When a specific location is selected, the list stays flat (no headers needed since all stylists are at that location).

```text
 [green dot] HAPPENING NOW                    [X]
 18 appointments in progress . 13 stylists working

 [MapPin] All Locations          [v]
 ────────────────────────────────────
 
 North Mesa
 ────────────────────────────────────
 [Avatar] Sarah M.    ...    Last wrap-up ~5:00 PM
 [Avatar] Jasmine T.  ...    Last wrap-up ~5:30 PM
 
 Val Vista Lakes
 ────────────────────────────────────
 [Avatar] Kira L.     ...    Last wrap-up ~6:00 PM
 [Avatar] Morgan W.   ...    Last wrap-up ~6:00 PM
```

### What Changes

**1. `src/hooks/useLiveSessionSnapshot.ts`**

- Add `locationId` and `locationName` fields to the `StylistDetail` type
- In the query, also select `location_id` from `phorest_appointments`
- Look up the location name from a locations query (or join)
- Populate the new fields when building each stylist's detail record
- Demo data: add location assignments split across the two locations

**2. `src/components/dashboard/LiveSessionDrilldown.tsx`**

- Import `isAllLocations` from `@/lib/locationFilter`
- When the drilldown location filter is "all":
  - Group stylist details by `locationName`
  - Render a location section header (subtle, sticky) before each group
  - Each header shows the location name and count of active stylists at that location
- When a specific location is selected: render flat list as today (no headers)
- Demo data updated to reflect location grouping

### Technical Details

| File | Change |
|------|--------|
| `src/hooks/useLiveSessionSnapshot.ts` | Add `locationId` + `locationName` to `StylistDetail`, select `location_id` in queries, resolve location names |
| `src/components/dashboard/LiveSessionDrilldown.tsx` | Group-by-location rendering when "All Locations" selected, section headers with location name + count |

Two files modified. No database changes.
