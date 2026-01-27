

# Add Location & Time Range Filters to Sales Bento Card

## Overview

Add inline location and date range filter controls directly inside the `SalesBentoCard` component. This makes the card fully self-contained so when it's pinned to the Command Center, users can still filter the data without needing to navigate to the Analytics Hub.

---

## Current State

The `SalesBentoCard` currently:
- Receives pre-calculated metrics as props from `SalesTabContent`
- Has no internal filtering controls
- Depends on parent-level filters from `AnalyticsHub`

When pinned to Command Center, the card would show data based on whatever filters were last set in the parent context, with no way to change them.

---

## Solution

Add compact filter dropdowns inside the card header that allow users to:
1. **Select Location** - All Locations or specific branch
2. **Select Date Range** - Today, 7d, 30d, This Month, etc.

The card will manage its own state and fetch its own data, making it fully independent.

---

## Visual Design

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚙ SALES DASHBOARD                                                          │
│ ┌────────────────┐ ┌─────────────────┐                                      │
│ │ 📍 All Locs ▼  │ │ 📅 Last 30d ▼  │                                      │
│ └────────────────┘ └─────────────────┘                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ ○ Monthly Goal  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  4%  │
│   ...                                                                       │
│ (rest of bento card content)                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation

### Step 1: Add Internal State & Hooks to SalesBentoCard

The card will manage its own filter state and use existing hooks to fetch data:

```typescript
// New props structure
interface SalesBentoCardProps {
  // Optional initial values (from parent context)
  initialLocationId?: string;
  initialDateRange?: DateRangeType;
  initialDateFrom?: string;
  initialDateTo?: string;
  
  // If provided, use external data (backward compatible)
  externalData?: {
    metrics: SalesMetrics;
    performers: Performer[];
    tomorrowData: { revenue: number; appointmentCount: number };
    goalTarget: number;
    goalLabel: string;
    isLoading: boolean;
  };
}
```

### Step 2: Add Filter UI in Card Header

```typescript
<CardHeader className="pb-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
    <div className="flex items-center gap-2">
      <LayoutDashboard className="w-5 h-5 text-primary" />
      <CardTitle className="font-display">Sales Dashboard</CardTitle>
    </div>
    
    {/* Inline Filters */}
    <div className="flex items-center gap-2">
      {/* Location Select */}
      <Select value={locationId} onValueChange={setLocationId}>
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <MapPin className="w-3 h-3 mr-1.5 text-muted-foreground" />
          <SelectValue placeholder="All Locations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          {locations.map(loc => (
            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Date Range Select */}
      <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeType)}>
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <Calendar className="w-3 h-3 mr-1.5 text-muted-foreground" />
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
  </div>
</CardHeader>
```

### Step 3: Internal Data Fetching

When no external data is provided, the card fetches its own:

```typescript
const [locationId, setLocationId] = useState(initialLocationId || 'all');
const [dateRange, setDateRange] = useState<DateRangeType>(initialDateRange || '30d');

// Calculate date range
const dateFilters = useMemo(() => {
  const now = new Date();
  switch (dateRange) {
    case 'today':
      return { dateFrom: format(now, 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
    case '7d':
      return { dateFrom: format(subDays(now, 7), 'yyyy-MM-dd'), dateTo: format(now, 'yyyy-MM-dd') };
    // ... other cases
  }
}, [dateRange]);

const locationFilter = locationId !== 'all' ? locationId : undefined;

// Self-contained data fetching
const { data: metrics, isLoading: metricsLoading } = useSalesMetrics({
  dateFrom: dateFilters.dateFrom,
  dateTo: dateFilters.dateTo,
  locationId: locationFilter,
});

const { data: stylistData, isLoading: stylistLoading } = useSalesByStylist(
  dateFilters.dateFrom, 
  dateFilters.dateTo
);

const { data: tomorrowData } = useTomorrowRevenue();
const { data: locations } = useActiveLocations();
const { goals } = useSalesGoals();
```

### Step 4: Update SalesTabContent

Simplify the parent component since the card is now self-contained:

```typescript
// Before: Passing many props
<SalesBentoCard
  currentRevenue={metrics?.totalRevenue || 0}
  goalTarget={currentGoal}
  // ... 10+ props
/>

// After: Just pass initial context
<SalesBentoCard
  initialLocationId={filters.locationId}
  initialDateRange={filters.dateRange}
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/sales/SalesBentoCard.tsx` | Add filter state, selects, and internal data fetching |
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Simplify props passed to SalesBentoCard |

---

## Benefits

1. **Self-Contained** - Card works independently when pinned to Command Center
2. **Interactive** - Users can change filters without leaving the dashboard
3. **Backward Compatible** - Initial values sync with parent Analytics Hub context
4. **Compact UI** - Small select dropdowns that don't overwhelm the card header

---

## Filter Options

**Location:**
- All Locations (default)
- Individual location options from database

**Date Range:**
- Today
- Last 7 days
- Last 30 days (default)
- This Week
- This Month
- Last Month

Custom date range is omitted for simplicity in the compact card view.

