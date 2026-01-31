
# Show All Locations in "By Location" Table (Even with Zero Sales)

## Problem
When filtering to "Today" (or any date range), locations without sales data are completely omitted from the "By Location" table. Users expect to see **all active locations** listed, with $0 values shown for those with no sales activity.

## Root Cause
In `useSalesByLocation` hook (`src/hooks/useSalesData.ts`), locations are only added to the results when iterating over appointment records. If a location has no appointments in the date range, it never gets initialized and is excluded from the final array.

**Current Logic (problematic):**
```
1. Fetch all locations
2. Fetch appointments for date range
3. Loop through appointments → only locations WITH appointments get added
4. Return results (missing locations with zero sales)
```

## Solution
Pre-populate the `byLocation` object with **all active locations** (with zero values) before processing appointments. This ensures every location appears in the table.

**Fixed Logic:**
```
1. Fetch active locations (is_active = true)
2. Pre-populate byLocation with ALL locations (zero values)
3. Fetch appointments for date range
4. Loop through appointments → add revenue to existing entries
5. Return results (all locations included)
```

## Implementation Details

### File: `src/hooks/useSalesData.ts`

**Change 1: Filter to active locations only (Line 360-362)**
```typescript
// Before
const { data: locations } = await supabase
  .from('locations')
  .select('id, name');

// After
const { data: locations } = await supabase
  .from('locations')
  .select('id, name, is_active')
  .eq('is_active', true);
```

**Change 2: Pre-populate all locations with zero values (Line 379-380)**
```typescript
// Aggregate by location - PRE-POPULATE all locations with zero values
const byLocation: Record<string, any> = {};

// Initialize all active locations with zero values
locations?.forEach(loc => {
  byLocation[loc.id] = {
    location_id: loc.id,
    name: loc.name || 'Unknown Location',
    totalRevenue: 0,
    serviceRevenue: 0,
    productRevenue: 0,
    totalServices: 0,
    totalProducts: 0,
    totalTransactions: 0,
  };
});
```

**Change 3: Simplify appointment loop (Lines 381-400)**
```typescript
// Now just add to existing entries (all locations already initialized)
data?.forEach(apt => {
  const key = apt.location_id || 'Unknown';
  if (byLocation[key]) {
    byLocation[key].totalRevenue += Number(apt.total_price) || 0;
    byLocation[key].serviceRevenue += Number(apt.total_price) || 0;
    byLocation[key].totalServices += 1;
    byLocation[key].totalTransactions += 1;
  }
  // Skip appointments for inactive/unknown locations
});
```

## Result After Fix
| Location | Revenue | Services | Products | Transactions | Avg Ticket |
|----------|---------|----------|----------|--------------|------------|
| Val Vista Lakes | $480 | $480 | $0 | 6 | $80 |
| North Mesa | $0 | $0 | $0 | 0 | $0 |
| Gilbert | $0 | $0 | $0 | 0 | $0 |

## File Changes Summary
| File | Changes |
|------|---------|
| `src/hooks/useSalesData.ts` | Modify `useSalesByLocation` to filter active locations and pre-populate all with zero values |

## Edge Cases Handled
- **New locations**: Will appear immediately with $0 if marked as `is_active = true`
- **Inactive locations**: Will not appear (excluded by filter)
- **Unknown location IDs in appointments**: Skipped (won't create phantom entries)
- **Sorting**: Still works - locations with $0 will sort to bottom when sorted by revenue descending
