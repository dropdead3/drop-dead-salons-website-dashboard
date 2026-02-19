

## Add Location Toggle Inside the "Happening Now" Drilldown

The drilldown dialog will get its own location filter, independent of the main dashboard filter. This lets users quickly switch locations while viewing live sessions without closing the dialog.

### What Changes

**1. `src/components/dashboard/LiveSessionDrilldown.tsx`**

- Add a `locationId` prop (passed from the parent indicator, which already has it)
- Add local state for a `drilldownLocationId` (initialized from the prop so it starts matching the dashboard filter)
- Import `useActiveLocations` to get the list of locations
- Import the `LocationSelect` component
- Render a compact location select between the header description and the gradient divider
- When the location changes locally, re-query the live data by passing it to a new `useLiveSessionSnapshot` call inside the drilldown itself (making the drilldown self-contained for data)
- Update the counts and stylist list based on the locally-selected location
- In demo mode, the location select still renders but the data stays static (demo data is unfiltered)

**2. `src/components/dashboard/LiveSessionIndicator.tsx`**

- Pass `locationId` through to `LiveSessionDrilldown` (already partially wired)

### UI Layout

The location select sits below the subtitle, above the stylist list:

```text
 [green dot] HAPPENING NOW                    [X]
 18 appointments in progress . 13 stylists working

 [MapPin] All Locations          [v]
 ────────────────────────────────────
 [Stylist rows...]
```

It uses the existing `LocationSelect` component for consistency with the rest of the app.

### Technical Details

| File | Change |
|------|--------|
| `src/components/dashboard/LiveSessionDrilldown.tsx` | Add location select, local state, self-contained data fetch |
| `src/components/dashboard/LiveSessionIndicator.tsx` | Pass `locationId` to drilldown |

Two files modified. No database changes.

