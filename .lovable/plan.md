
# Move Filters to Command Center Level

## Overview

The goal is to remove the location and time range filter controls from the `SalesBentoCard` component and instead place them at the `CommandCenterAnalytics` level. This way, when multiple analytics cards are pinned to the Command Center, a single set of filters at the top will control all of them simultaneously.

---

## Current State

- **SalesBentoCard** has its own internal filter state (`locationId`, `dateRange`) and renders filter UI in its header
- **CommandCenterAnalytics** has hardcoded date ranges (`dateFrom`, `dateTo` set to last 30 days) with no user-facing filter controls
- Each analytics card operates independently with no shared filter context

---

## Solution

1. **Remove filters from SalesBentoCard** - Make the card accept filter values as props (controlled mode) rather than managing its own state
2. **Add filter controls to CommandCenterAnalytics** - Create a shared filter bar that appears when any analytics cards are pinned
3. **Pass filters to all pinned cards** - All analytics components receive the same filter values from the parent

---

## Implementation

### Step 1: Update `SalesBentoCard.tsx`

Change from internal state management to accepting filters as props:

```typescript
// Before (internal state):
const [locationId, setLocationId] = useState(initialLocationId);
const [dateRange, setDateRange] = useState<DateRangeType>(initialDateRange);

// After (props-driven):
interface SalesBentoCardProps {
  locationId?: string;
  dateRange?: DateRangeType;
  dateFrom?: string;
  dateTo?: string;
}
```

**Changes:**
- Remove the `useState` for filters
- Remove the `Select` dropdowns from the card header
- Accept `locationId`, `dateRange`, `dateFrom`, `dateTo` as props
- Keep internal `getDateRange()` helper for when `dateFrom/dateTo` not provided
- Simplify the card header to just show title

### Step 2: Update `CommandCenterAnalytics.tsx`

Add filter state and UI at the top level:

```typescript
export function CommandCenterAnalytics() {
  // Add filter state
  const [locationId, setLocationId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRangeType>('thisMonth');
  
  // Fetch locations for dropdown
  const { data: locations } = useActiveLocations();
  
  // Calculate date filters
  const dateFilters = useMemo(() => getDateRange(dateRange), [dateRange]);
  
  // ... existing visibility checks ...
  
  return (
    <div className="space-y-6">
      {/* Filter Bar - only shown when cards are pinned */}
      {hasAnyPinned && (
        <div className="flex flex-wrap items-center gap-3 pb-2">
          {/* Location Select */}
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger className="h-9 w-[160px] text-sm">
              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations?.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Date Range Select */}
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeType)}>
            <SelectTrigger className="h-9 w-[150px] text-sm">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Sales Dashboard Bento */}
      {hasSalesDashboard && (
        <VisibilityGate elementKey="sales_dashboard_bento">
          <SalesBentoCard 
            locationId={locationId}
            dateRange={dateRange}
            dateFrom={dateFilters.dateFrom}
            dateTo={dateFilters.dateTo}
          />
        </VisibilityGate>
      )}
      
      {/* Other pinned cards also receive filter props */}
      ...
    </div>
  );
}
```

### Step 3: Update `SalesTabContent.tsx`

Pass parent filters to the SalesBentoCard:

```typescript
<SalesBentoCard
  locationId={filters.locationId}
  dateRange={filters.dateRange}
  dateFrom={filters.dateFrom}
  dateTo={filters.dateTo}
/>
```

---

## Visual Layout

### Command Center (with filters at top):

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ COMMAND CENTER                                                              │
│ ┌────────────────┐ ┌─────────────────┐                                      │
│ │ 📍 All Locs ▼  │ │ 📅 This Month ▼ │  ← Shared filters for all cards     │
│ └────────────────┘ └─────────────────┘                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ SALES DASHBOARD  ← No longer has its own filters                       │ │
│ │ ○ Monthly Goal ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  4%   │ │
│ │ ...                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ OTHER PINNED CARD  ← Also uses the same shared filters                 │ │
│ │ ...                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/sales/SalesBentoCard.tsx` | Remove internal filter state & UI, accept filters as props |
| `src/components/dashboard/CommandCenterAnalytics.tsx` | Add filter state, filter UI bar, pass filters to cards |
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Pass filter props from AnalyticsHub to SalesBentoCard |

---

## Technical Details

### Shared Helper Function

The `getDateRange()` helper function that converts a `DateRangeType` to `{dateFrom, dateTo}` will be moved to a shared utility file or kept in the SalesBentoCard with a fallback for when explicit dates aren't provided:

```typescript
// Use explicit dates if provided, otherwise calculate from dateRange
const dateFilters = useMemo(() => {
  if (dateFrom && dateTo) {
    return { dateFrom, dateTo };
  }
  return getDateRange(dateRange || 'thisMonth');
}, [dateFrom, dateTo, dateRange]);
```

### Props Interface

```typescript
interface SalesBentoCardProps {
  locationId?: string;
  dateRange?: 'today' | '7d' | '30d' | 'thisWeek' | 'thisMonth' | 'lastMonth';
  dateFrom?: string;
  dateTo?: string;
}
```

---

## Benefits

1. **Unified Filtering** - All pinned analytics cards use the same filters
2. **Cleaner Card UI** - Cards focus on displaying data, not filter controls
3. **Consistent UX** - Filter bar matches the Analytics Hub pattern
4. **Simpler Props** - Cards receive pre-calculated filter values
5. **Scalable** - Easy to add more pinnable cards that respect the same filters

---

## Result

- Filters appear at the Command Center level when any analytics cards are pinned
- Changing filters updates all visible analytics cards simultaneously
- The SalesBentoCard becomes purely a display component
- Same card can be used in both Analytics Hub (with parent filters) and Command Center (with shared filters)
