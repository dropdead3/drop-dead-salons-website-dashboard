

## Fix: Demo Data Not Filtering by Location Toggle

### Problem

In `LiveSessionDrilldown.tsx`, line 85:
```typescript
const details = DEMO_MODE ? DEMO_DETAILS : live.stylistDetails;
```
This always returns all 13 demo stylists regardless of the selected location. The location toggle changes `drilldownLocationId`, but demo data ignores it entirely.

Similarly, `sessionCount` and `stylistCount` on lines 86-87 are hardcoded and never reflect the filtered subset.

### Fix (single file: `src/components/dashboard/LiveSessionDrilldown.tsx`)

1. When in demo mode and a specific location is selected, filter `DEMO_DETAILS` by matching `locationId` against the demo location IDs (`loc-1`, `loc-2`)
2. Since the `LocationSelect` component uses real location UUIDs but demo data uses `loc-1`/`loc-2`, add a demo location name map that maps the selected location's display name back to the demo data
3. Simpler approach: filter demo details by `locationName` matching the selected location's label, or just filter by `locationId` if `drilldownLocationId` matches `loc-1`/`loc-2`

**Cleanest approach:** Since `LocationSelect` returns real location UUIDs that won't match `loc-1`/`loc-2`, resolve the real location name from the `LocationSelect` and filter demo data by `locationName`. Alternatively, use `useActiveLocations` to map the selected UUID to a name and match against demo `locationName`.

**Implementation:**
- Import `useActiveLocations` (already available in the codebase)
- When demo mode is on and a specific location is selected, look up the location name from the active locations list
- Filter `DEMO_DETAILS` where `locationName` matches
- Derive `sessionCount` and `stylistCount` from the filtered list instead of hardcoding

```typescript
const { data: activeLocations } = useActiveLocations();

const filteredDemoDetails = useMemo(() => {
  if (!DEMO_MODE) return [];
  if (isAllLocations(drilldownLocationId)) return DEMO_DETAILS;
  // Map selected location UUID to its name, then filter demo data by name
  const selectedLoc = activeLocations?.find(l => l.id === drilldownLocationId);
  if (!selectedLoc) return DEMO_DETAILS;
  return DEMO_DETAILS.filter(d => d.locationName === selectedLoc.name);
}, [drilldownLocationId, activeLocations]);

const details = DEMO_MODE ? filteredDemoDetails : live.stylistDetails;
const stylistCount = details.length;
// Approximate session count from demo data proportionally
const sessionCount = DEMO_MODE
  ? Math.round((details.length / DEMO_DETAILS.length) * 18)
  : live.inSessionCount;
```

If the real location names don't match "North Mesa" / "Val Vista Lakes" exactly, the demo data will fall back to showing all stylists (safe default). When demo mode is removed, this logic goes away entirely.

### Technical Details

| File | Change |
|------|--------|
| `src/components/dashboard/LiveSessionDrilldown.tsx` | Filter demo data by selected location name; derive counts from filtered list |

One file modified. No database changes.

