

## Fix "Unknown" Location Badge in Service Costs Card

### Root Cause

The `AnalyticsFilterBadge` component resolves the location name with this logic:

```
locationId === 'all' ? 'All Locations' : locations.find(l => l.id === locationId)?.name || 'Unknown'
```

The `ServiceCostsProfitsCard` declares `locationId` as `locationId?: string` (optional). When no location filter is applied, the value is `undefined` rather than the string `"all"`. Since `undefined !== 'all'`, it falls through to the `.find()` lookup, which naturally can not match `undefined` against any location ID, resulting in the fallback text "Unknown".

### Fix

Update the `AnalyticsFilterBadge` component to also treat `undefined`, `null`, and empty string as "All Locations":

**File: `src/components/dashboard/AnalyticsFilterBadge.tsx`**

Change the location name resolution from:

```tsx
const locationName = locationId === 'all'
  ? 'All Locations'
  : locations?.find(l => l.id === locationId)?.name || 'Unknown';
```

To:

```tsx
const locationName = (!locationId || locationId === 'all')
  ? 'All Locations'
  : locations?.find(l => l.id === locationId)?.name || 'Unknown';
```

This is a one-line change. The `!locationId` check covers `undefined`, `null`, and empty string -- all of which semantically mean "no location filter applied" and should display as "All Locations."

No other files need to change.
