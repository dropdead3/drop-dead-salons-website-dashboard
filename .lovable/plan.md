

# Add Filter Context Display to Analytics Cards

## Overview

Add a compact filter context indicator in the top-right corner of each analytics card showing the current location and date range being applied. This makes it immediately clear what data is being displayed without needing to scroll up to the filter bar.

---

## Design

```text
┌─────────────────────────────────────────────────────────────────┐
│  📊 SALES OVERVIEW                           📍 Dallas · Today │
│  All locations combined                                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      [Card content]                         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

The badge displays:
- **Location icon + name**: "All Locations" or specific location name (e.g., "Dallas")  
- **Separator dot** (·)
- **Date range label**: "Today", "This Week", "Last 30 days", etc.

Compact, muted styling so it doesn't compete with the main card content.

---

## Implementation Approach

### Option 1: Create a Reusable Component

Create a new `AnalyticsFilterBadge` component that can be placed in the top-right of any analytics card header.

### Files to Create/Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/AnalyticsFilterBadge.tsx` | **NEW** - Compact badge showing current filter context |
| `src/components/dashboard/PinnedAnalyticsCard.tsx` | Pass filters to cards that support displaying them |
| Individual card components (as needed) | Add the badge to card headers |

---

## New Component: AnalyticsFilterBadge

```tsx
// src/components/dashboard/AnalyticsFilterBadge.tsx
import { MapPin, Calendar } from 'lucide-react';
import { useActiveLocations } from '@/hooks/useLocations';
import type { DateRangeType } from './PinnedAnalyticsCard';

const DATE_RANGE_LABELS: Record<DateRangeType, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
};

interface AnalyticsFilterBadgeProps {
  locationId: string;
  dateRange: DateRangeType;
  className?: string;
}

export function AnalyticsFilterBadge({ 
  locationId, 
  dateRange,
  className 
}: AnalyticsFilterBadgeProps) {
  const { data: locations } = useActiveLocations();
  
  // Resolve location name
  const locationName = locationId === 'all' 
    ? 'All Locations'
    : locations?.find(l => l.id === locationId)?.name || 'Unknown';
  
  const dateLabel = DATE_RANGE_LABELS[dateRange] || dateRange;
  
  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs text-muted-foreground",
      className
    )}>
      <MapPin className="w-3 h-3" />
      <span>{locationName}</span>
      <span className="text-muted-foreground/50">·</span>
      <Calendar className="w-3 h-3" />
      <span>{dateLabel}</span>
    </div>
  );
}
```

---

## Integration Pattern

### Option A: Inject at PinnedAnalyticsCard Level (Recommended)

Wrap each card with a container that adds the badge in the top-right corner:

```tsx
// In PinnedAnalyticsCard.tsx
return (
  <div className="relative">
    <div className="absolute top-4 right-4 z-10">
      <AnalyticsFilterBadge 
        locationId={filters.locationId} 
        dateRange={filters.dateRange} 
      />
    </div>
    {/* Card content */}
  </div>
);
```

**Pros**: Single implementation point, all pinned cards get the badge automatically  
**Cons**: May overlap with card-specific controls (date pickers, visibility toggles)

### Option B: Pass Props to Individual Cards

Pass the filters to each card component and let them render the badge in their header.

**Pros**: Cards control exact badge placement  
**Cons**: Requires updating each card component

---

## Recommended Approach: Hybrid

1. **Create the `AnalyticsFilterBadge` component** for reusability
2. **Update `PinnedAnalyticsCard`** to pass `filterContext` prop to card components
3. **Update key cards** (Sales Overview, Operations Stats, Top Performers, etc.) to display the badge in their header area

This gives cards control over badge placement while keeping the filter data flow centralized.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/AnalyticsFilterBadge.tsx` | **NEW**: Reusable filter context badge component |
| `src/components/dashboard/PinnedAnalyticsCard.tsx` | Export DATE_RANGE_LABELS; pass filter props to card components |
| `src/components/dashboard/AggregateSalesCard.tsx` | Add badge to header area |
| `src/components/dashboard/operations/OperationsQuickStats.tsx` | Add badge after section title |
| `src/components/dashboard/sales/TopPerformersCard.tsx` | Add badge to header |
| `src/components/dashboard/sales/ClientFunnelCard.tsx` | Add badge to header |
| `src/components/dashboard/NewBookingsCard.tsx` | Add badge to header |
| `src/components/dashboard/sales/ForecastingCard.tsx` | Add badge to header (if internal filters are hidden) |
| `src/components/dashboard/sales/CapacityUtilizationCard.tsx` | Add badge to header |
| Other pinned card components as needed | Add badge |

---

## Technical Details

### Props Update Pattern

For cards that need filter context display:

```tsx
interface CardProps {
  // ... existing props
  
  // Optional filter context for pinned dashboard display
  filterContext?: {
    locationId: string;
    dateRange: DateRangeType;
  };
}
```

### Badge Placement in Card Headers

Most cards have a header structure like:

```tsx
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-2">
    <Icon />
    <h2>CARD TITLE</h2>
  </div>
  {/* Add badge here */}
  {filterContext && (
    <AnalyticsFilterBadge 
      locationId={filterContext.locationId}
      dateRange={filterContext.dateRange}
    />
  )}
</div>
```

---

## User Experience

When viewing pinned analytics cards on the dashboard:

- Each card will display a small badge like: **📍 Dallas · Today**
- The badge confirms what filters are active for that card's data
- Users can still adjust filters via the unified filter bar at the top
- Badges update automatically when filters change

