
# Add Sort Functionality to Command Center "By Location" Table

## Overview
Add clickable sort headers to the "By Location" table in the Command Center's `AggregateSalesCard` component. Users will be able to sort locations by clicking any column header (Revenue, Services, Products, Transactions, Avg Ticket). Default sort will be **Revenue (highest to lowest)**.

## Current State
- The location table in `AggregateSalesCard.tsx` (lines 500-580) displays location data without any sorting controls
- Data is rendered directly from the `locationData` array returned by `useSalesByLocation` hook
- The codebase has established patterns for sortable tables in:
  - `OperationalMetrics.tsx` - Uses `handleSort` and `getSortIcon` helpers
  - `CampaignPerformanceTable.tsx` - Similar pattern with `useMemo` for sorted data

## Implementation Approach

### 1. Add Sort State and Types
Add state variables and type definitions to track current sort field and direction:

```
+------------------------------------------------------------------+
|  Type: SortField = 'name' | 'totalRevenue' | 'serviceRevenue' |  |
|                    'productRevenue' | 'totalTransactions' |      |
|                    'avgTicket'                                   |
|  Type: SortDirection = 'asc' | 'desc'                           |
|  Default: sortField = 'totalRevenue', sortDirection = 'desc'     |
+------------------------------------------------------------------+
```

### 2. Add Sort Logic Functions
Following the existing pattern from `OperationalMetrics.tsx`:

- **`handleSort(field)`**: Toggle direction if same field, otherwise switch to new field with `desc` default
- **`getSortIcon(field)`**: Return `ArrowUpDown` (neutral), `ArrowUp` (asc), or `ArrowDown` (desc)

### 3. Create Sorted Data with useMemo
Create a `sortedLocationData` array that applies the sort before rendering:

```
const sortedLocationData = useMemo(() => {
  if (!locationData) return [];
  return [...locationData].sort((a, b) => {
    let aVal, bVal;
    if (sortField === 'avgTicket') {
      aVal = a.totalTransactions > 0 ? a.totalRevenue / a.totalTransactions : 0;
      bVal = b.totalTransactions > 0 ? b.totalRevenue / b.totalTransactions : 0;
    } else if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else {
      aVal = a[sortField] ?? 0;
      bVal = b[sortField] ?? 0;
    }
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });
}, [locationData, sortField, sortDirection]);
```

### 4. Update Table Headers with Sort Controls
Transform static headers into clickable buttons with sort icons:

**Before:**
```tsx
<TableHead className="font-display text-xs text-center">Revenue</TableHead>
```

**After:**
```tsx
<TableHead className="font-display text-xs text-center">
  <button 
    onClick={() => handleSort('totalRevenue')}
    className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors"
  >
    Revenue {getSortIcon('totalRevenue')}
  </button>
</TableHead>
```

### Sortable Columns
| Column | Sort Field | Notes |
|--------|------------|-------|
| Location | `name` | Alphabetical sort |
| Revenue | `totalRevenue` | **Default sort (desc)** |
| Services | `serviceRevenue` | Numeric sort |
| Products | `productRevenue` | Numeric sort |
| Transactions | `totalTransactions` | Numeric sort |
| Avg Ticket | `avgTicket` | Calculated field (revenue/transactions) |
| Trend | *Not sortable* | Visual sparkline only |

### 5. Update Table Body Rendering
Change from `locationData.map()` to `sortedLocationData.map()`.

## File Changes Summary

| File | Changes |
|------|---------|
| `src/components/dashboard/AggregateSalesCard.tsx` | Add sort state, types, handlers, getSortIcon, useMemo for sorted data, update table headers |

## Technical Details

### New Imports Required
```tsx
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useMemo } from 'react'; // Already imported as part of useState
```

### State Additions (around line 78)
```tsx
// Location table sorting
type LocationSortField = 'name' | 'totalRevenue' | 'serviceRevenue' | 'productRevenue' | 'totalTransactions' | 'avgTicket';
type SortDirection = 'asc' | 'desc';

const [locationSortField, setLocationSortField] = useState<LocationSortField>('totalRevenue');
const [locationSortDirection, setLocationSortDirection] = useState<SortDirection>('desc');
```

### Handler Functions (after existing handlers)
```tsx
const handleLocationSort = (field: LocationSortField) => {
  if (locationSortField === field) {
    setLocationSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  } else {
    setLocationSortField(field);
    setLocationSortDirection('desc');
  }
};

const getLocationSortIcon = (field: LocationSortField) => {
  if (locationSortField !== field) {
    return <ArrowUpDown className="w-3 h-3 text-muted-foreground" />;
  }
  return locationSortDirection === 'asc' 
    ? <ArrowUp className="w-3 h-3 text-primary" />
    : <ArrowDown className="w-3 h-3 text-primary" />;
};
```

## UI Preview
```
+------------------------------------------------------------------+
| LOCATION [↕]  REVENUE [↓]  TREND  SERVICES [↕]  PRODUCTS [↕] ... |
+------------------------------------------------------------------+
| Val Vista     $2,105       ~~~    $2,105        $0          ...  |
| North Mesa    $1,565       ~~~    $1,565        $0          ...  |
+------------------------------------------------------------------+

[↓] = Currently sorted descending (primary color)
[↕] = Sortable but not active (muted color)
```

## Edge Cases Handled
- **Empty data**: `sortedLocationData` returns empty array, same as before
- **Null values**: Uses `?? 0` fallback for numeric comparisons
- **Avg Ticket calculation**: Handles division by zero with ternary check
- **String sorting**: Uses `localeCompare()` for location names
