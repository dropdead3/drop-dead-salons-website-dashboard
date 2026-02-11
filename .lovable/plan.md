

## Collapsible Location Table with Region Filter

### Problem
Enterprise accounts could have 500+ locations, making the "By Location" table unusably long. Currently all locations render in a flat list with no way to group or collapse them.

### Solution
1. Make the location table collapsible -- show only the top 5 locations by default, with an "Show all X locations" toggle to expand
2. Add a region filter dropdown above the table so enterprise users can narrow down by region
3. Keep the existing sort, Status column, and click-to-drill behavior intact

### What Changes

**1. Region data** -- Check if locations have a region field; if not, group by whatever geographic grouping is available. If no region data exists in the DB, we skip the region filter for now and focus on collapse/expand.

**2. Collapsible behavior** (`AggregateSalesCard.tsx`)
- Add a `locationsExpanded` state (default: `false`)
- When collapsed, show only the first 5 sorted locations
- Below the table, show a button: "Show all 12 locations" or "Show less"
- Animate the expand/collapse with a smooth transition
- When there are 5 or fewer locations, hide the toggle entirely (no need)

**3. Region filter** (`AggregateSalesCard.tsx`)
- Add a region Select dropdown next to the "BY LOCATION" header
- Derive unique regions from location data
- When a region is selected, filter `sortedLocationData` to only that region's locations
- "All Regions" as default option
- Only render the region filter when there are 2+ distinct regions

### Visual Design

```text
[Building icon] BY LOCATION          [Region: All Regions v]
+----------------------------------------------------------+
| Location | Revenue | Trend | Services | Products | ...   |
|----------|---------|-------|----------|----------|--------|
| Mesa     | $1,146  |  ~~~  | $800     | $346     | ...   |
| Val Vista| $875    |  ~~~  | $600     | $275     | ...   |
| Tempe    | $650    |  ~~~  | $450     | $200     | ...   |
| Downtown | $520    |  ~~~  | $380     | $140     | ...   |
| Gilbert  | $410    |  ~~~  | $310     | $100     | ...   |
+----------------------------------------------------------+
         [ Show all 12 locations ]
```

### Files to Change

**1. Check location schema** -- verify if `phorest_locations` or similar table has a `region` field

**2. `src/hooks/useLocations.ts`** -- if region data exists, ensure it's returned in the active locations query

**3. `src/components/dashboard/AggregateSalesCard.tsx`**
- Add `locationsExpanded` boolean state (default false)
- Add `regionFilter` string state (default 'all')
- Derive `availableRegions` from location data
- Filter `sortedLocationData` by region when selected
- Slice to first 5 when collapsed
- Add expand/collapse button below the table
- Add region Select dropdown in the "BY LOCATION" header row
- No new dependencies needed

### Technical Details
- The collapse default of 5 is a sensible balance -- enough to see top performers, not overwhelming
- Region filter uses client-side filtering since all location data is already fetched
- The expand/collapse uses simple state toggle with conditional slice -- no animation library needed (could add framer-motion later if desired)
- Sorting still applies before slicing, so collapsed view always shows the top 5 by current sort
- The "Show all X locations" count reflects the filtered count (after region filter)

