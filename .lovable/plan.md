
# Add Location Breakdown to New Bookings Card

## Overview

Add a "By Location" breakdown section to the New Bookings card that shows booking counts per location. This enhancement applies to both the standalone pinned card and the Command Center version.

## Current State

The New Bookings card currently shows:
- **Hero metric**: Total booked today (5)
- **Breakdown**: New Clients (0) vs Returning Clients (5)
- **30-Day comparison**: Last 30 days count with trend vs previous 30 days

The card receives `filterContext` (locationId, dateRange) but:
1. The `useNewBookings` hook doesn't use location filtering
2. The hook doesn't return location breakdown data
3. `CommandCenterAnalytics.tsx` doesn't pass `filterContext` to `NewBookingsCard`

## Proposed UI Enhancement

Add a new "By Location" section below the New vs Returning breakdown:

```text
┌────────────────────────────────────────────────────────────────┐
│  NEW BOOKINGS  ⚙                           📍 All · 📅 Today  │
│                                                                │
│                           5                                    │
│                    Booked Today ⓘ                              │
│                                                                │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │       👤+           │  │        🔄           │              │
│  │        0            │  │         5           │              │
│  │   New Clients ⓘ     │  │  Returning Clients  │              │
│  └─────────────────────┘  └─────────────────────┘              │
│                                                                │
│  BY LOCATION                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Val Vista Lakes                                   3    │   │
│  │  North Mesa                                        2    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  Last 30 Days: 286                          — 0% vs prev 30d  │
└────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### 1. Update `useNewBookings` Hook

Modify to fetch and return location breakdown data:

```typescript
// src/hooks/useNewBookings.ts

export function useNewBookings(locationId?: string) {
  // ... existing date calculations ...

  return useQuery({
    queryKey: ['new-bookings', format(today, 'yyyy-MM-dd'), locationId || 'all'],
    queryFn: async () => {
      // Fetch locations for name lookup
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name')
        .eq('is_active', true);

      const locationLookup: Record<string, string> = {};
      locations?.forEach(loc => {
        locationLookup[loc.id] = loc.name;
      });

      // Modify today's query to include location_id
      let todayQuery = supabase
        .from('phorest_appointments')
        .select('id, total_price, created_at, is_new_client, location_id')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .not('status', 'eq', 'cancelled');

      // Apply location filter if specified
      if (locationId && locationId !== 'all') {
        todayQuery = todayQuery.eq('location_id', locationId);
      }

      // ... other queries similarly filtered ...

      // Calculate location breakdown from today's bookings
      const byLocation: Record<string, { name: string; count: number }> = {};
      bookedToday.forEach(apt => {
        const locId = apt.location_id || 'unknown';
        if (!byLocation[locId]) {
          byLocation[locId] = {
            name: locationLookup[locId] || 'Unknown',
            count: 0,
          };
        }
        byLocation[locId].count += 1;
      });

      const locationBreakdown = Object.entries(byLocation)
        .map(([id, data]) => ({ locationId: id, ...data }))
        .sort((a, b) => b.count - a.count);

      return {
        // ... existing metrics ...
        locationBreakdown,
      };
    },
  });
}
```

### 2. Update `NewBookingsCard` Component

Add the location breakdown UI section:

```typescript
// src/components/dashboard/NewBookingsCard.tsx

export function NewBookingsCard({ filterContext }: NewBookingsCardProps) {
  const { data, isLoading } = useNewBookings(filterContext?.locationId);
  
  // Show location breakdown only when viewing "All Locations"
  const showLocationBreakdown = !filterContext?.locationId || filterContext.locationId === 'all';
  
  return (
    <Card className="p-6">
      {/* ... existing header, hero, new/returning breakdown ... */}

      {/* Location Breakdown - only shown for "All Locations" */}
      {showLocationBreakdown && data?.locationBreakdown && data.locationBreakdown.length > 1 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              By Location
            </span>
          </div>
          <div className="space-y-2">
            {data.locationBreakdown.map(loc => (
              <div
                key={loc.locationId}
                className="flex items-center justify-between p-2 bg-muted/20 rounded-md"
              >
                <span className="text-sm">{loc.name}</span>
                <span className="font-display tabular-nums">{loc.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ... existing 30-day comparison ... */}
    </Card>
  );
}
```

### 3. Fix CommandCenterAnalytics

Pass `filterContext` to `NewBookingsCard` (currently missing):

```typescript
// src/components/dashboard/CommandCenterAnalytics.tsx

case 'new_bookings':
  return (
    <VisibilityGate key={cardId} elementKey="new_bookings">
      <NewBookingsCard 
        filterContext={{
          locationId: locationId,
          dateRange: dateRange,
        }}
      />
    </VisibilityGate>
  );
```

## File Changes Summary

| File | Changes |
|------|---------|
| `src/hooks/useNewBookings.ts` | Add `locationId` param, fetch location names, return `locationBreakdown` array |
| `src/components/dashboard/NewBookingsCard.tsx` | Add "By Location" section with list of locations and counts |
| `src/components/dashboard/CommandCenterAnalytics.tsx` | Pass `filterContext` to `NewBookingsCard` |

## Technical Notes

1. **Location filtering**: When a specific location is selected, the breakdown hides (since there's only one location)
2. **Graceful handling**: Locations without bookings don't appear in the breakdown (only active locations with at least 1 booking)
3. **Sorting**: Locations are sorted by booking count (highest first)
4. **Query key**: Includes `locationId` to ensure proper cache invalidation when filter changes
5. **Follows existing pattern**: Uses same approach as `useSalesByLocation` hook

## UX Behavior

| Filter State | Location Breakdown Behavior |
|--------------|---------------------------|
| All Locations | Shows breakdown by location |
| Specific Location | Hidden (redundant) |
| Single-location org | Hidden (only one location exists) |
