
# Location-Based Analytics Permissions for Leadership

## Overview

Implement granular location-based access control so that leadership users (admin, manager) who are assigned to specific locations can only see analytics and stats for their assigned location(s). Super admins retain full access to all locations.

---

## Current State

**How it works today:**
- All leadership users see the same `AnalyticsFilterBar` with "All Locations" option and all active locations
- Users can freely toggle between any location to view its analytics
- Location assignment exists on `employee_profiles` via `location_id` (single) and `location_ids` (array)
- No permission currently controls whether a user can view cross-location analytics

**Current location data on employee profiles:**
- `location_id` (TEXT) - Legacy single location assignment
- `location_ids` (TEXT[]) - Multi-location support array

---

## Solution

### Access Control Rules

| User Type | Access Level |
|-----------|--------------|
| Super Admin (`is_super_admin = true`) | All locations + "All Locations" aggregate |
| Admin/Manager with `view_all_locations_analytics` permission | All locations + "All Locations" aggregate |
| Admin/Manager assigned to specific location(s) | Only their assigned locations (no aggregate view) |
| Admin/Manager with NO location assignment | Only aggregate "All Locations" (edge case fallback) |

### New Permission

Create a new permission that allows cross-location analytics access:

| Permission Name | Category | Description |
|-----------------|----------|-------------|
| `view_all_locations_analytics` | Management | View analytics and stats across all salon locations |

By default, this permission will be granted to `super_admin` only. Admins and managers will NOT have it by default, restricting them to their assigned locations.

---

## Implementation

### Step 1: Add New Permission (Database Migration)

```sql
INSERT INTO permissions (id, name, description, category)
VALUES (
  gen_random_uuid(),
  'view_all_locations_analytics',
  'View analytics and stats across all salon locations',
  'Management'
);

-- Grant to super_admin by default
INSERT INTO role_permissions (role, permission_id)
SELECT 'super_admin', id FROM permissions WHERE name = 'view_all_locations_analytics';
```

### Step 2: Create `useUserLocationAccess` Hook

A new hook that encapsulates the location access logic:

```typescript
// src/hooks/useUserLocationAccess.ts
export function useUserLocationAccess() {
  const { hasPermission } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const { data: allLocations } = useActiveLocations();
  
  // Super admin or has cross-location permission
  const canViewAllLocations = profile?.is_super_admin || 
    hasPermission('view_all_locations_analytics');
  
  // Get user's assigned locations
  const assignedLocationIds = useMemo(() => {
    if (!profile) return [];
    return profile.location_ids?.length 
      ? profile.location_ids 
      : profile.location_id 
        ? [profile.location_id] 
        : [];
  }, [profile]);
  
  // Filter locations based on access
  const accessibleLocations = useMemo(() => {
    if (!allLocations) return [];
    if (canViewAllLocations) return allLocations;
    return allLocations.filter(loc => assignedLocationIds.includes(loc.id));
  }, [allLocations, canViewAllLocations, assignedLocationIds]);
  
  // Determine if "All Locations" aggregate is available
  const canViewAggregate = canViewAllLocations || assignedLocationIds.length === 0;
  
  // Get default location (first assigned or 'all' if permitted)
  const defaultLocationId = useMemo(() => {
    if (canViewAllLocations) return 'all';
    return assignedLocationIds[0] || 'all';
  }, [canViewAllLocations, assignedLocationIds]);
  
  return {
    canViewAllLocations,
    accessibleLocations,
    assignedLocationIds,
    canViewAggregate,
    defaultLocationId,
    isLoading: !profile || !allLocations,
  };
}
```

### Step 3: Update `AnalyticsFilterBar`

Modify to accept location access constraints:

```typescript
interface AnalyticsFilterBarProps {
  locationId: string;
  onLocationChange: (value: string) => void;
  dateRange: DateRangeType;
  onDateRangeChange: (value: DateRangeType) => void;
  // New props for location restrictions
  accessibleLocations?: Location[];
  canViewAggregate?: boolean;
}

export function AnalyticsFilterBar({
  locationId,
  onLocationChange,
  dateRange,
  onDateRangeChange,
  accessibleLocations,
  canViewAggregate = true,
}: AnalyticsFilterBarProps) {
  // Use provided locations or fetch all
  const { data: allLocations } = useActiveLocations();
  const locations = accessibleLocations ?? allLocations;
  
  // If only one location and no aggregate, hide the selector entirely
  const showLocationSelector = canViewAggregate || (locations?.length ?? 0) > 1;
  
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Location Select - conditionally rendered */}
      {showLocationSelector && (
        <Select value={locationId} onValueChange={onLocationChange}>
          <SelectTrigger className="h-9 w-auto min-w-[180px] text-sm">
            <MapPin className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {canViewAggregate && (
              <SelectItem value="all">All Locations</SelectItem>
            )}
            {locations?.map(loc => (
              <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {/* Single location badge (when only one location assigned) */}
      {!showLocationSelector && locations?.length === 1 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span>{locations[0].name}</span>
        </div>
      )}
      
      {/* Date Range Select - unchanged */}
      ...
    </div>
  );
}
```

### Step 4: Update `DashboardHome.tsx`

Integrate the location access hook:

```typescript
// In DashboardHome component
const { 
  accessibleLocations, 
  canViewAggregate, 
  defaultLocationId,
  isLoading: locationAccessLoading 
} = useUserLocationAccess();

// Initialize locationId with the user's default (not always 'all')
const [locationId, setLocationId] = useState<string>('');

// Set default when access data loads
useEffect(() => {
  if (!locationAccessLoading && !locationId) {
    setLocationId(defaultLocationId);
  }
}, [locationAccessLoading, defaultLocationId]);

// Pass to DashboardSections
<DashboardSections 
  ...
  analyticsFilters={analyticsFilters}
  onLocationChange={setLocationId}
  onDateRangeChange={setDateRange}
  accessibleLocations={accessibleLocations}
  canViewAggregate={canViewAggregate}
/>
```

### Step 5: Update Analytics Hub (Optional Enhancement)

Apply the same restrictions to the Analytics Hub pages so location restrictions are consistent across the application.

---

## Visual Behavior

### Super Admin / Users with Permission

```text
┌─────────────────────────────────────────────┐
│ 📍 All Locations ▼  │  📅 This Month ▼      │
│     ├── All Locations                       │
│     ├── Downtown Salon                      │
│     ├── Uptown Studio                       │
│     └── West Side Location                  │
└─────────────────────────────────────────────┘
```

### Manager Assigned to "Downtown Salon" Only

```text
┌─────────────────────────────────────────────┐
│ 📍 Downtown Salon   │  📅 This Month ▼      │
│     (no dropdown - single location badge)   │
└─────────────────────────────────────────────┘
```

### Manager Assigned to 2+ Locations (but not all)

```text
┌─────────────────────────────────────────────┐
│ 📍 Downtown Salon ▼ │  📅 This Month ▼      │
│     ├── Downtown Salon                      │
│     └── Uptown Studio                       │
│     (no "All Locations" option)             │
└─────────────────────────────────────────────┘
```

---

## Location Leaderboard Exception

For the location leaderboard specifically (cross-location comparison), we can add a special case:

- Users can see a **read-only leaderboard** comparing locations, even if they can't drill into other location's detailed stats
- This encourages healthy competition while protecting detailed analytics
- Implementation: The leaderboard component checks for a separate `view_location_leaderboard` permission or shows aggregated/anonymized data

---

## Files to Create/Modify

| File | Changes |
|------|---------|
| `src/hooks/useUserLocationAccess.ts` | **NEW** - Hook for location access logic |
| `src/components/dashboard/AnalyticsFilterBar.tsx` | Accept location restrictions as props |
| `src/pages/dashboard/DashboardHome.tsx` | Integrate location access hook |
| Database migration | Add `view_all_locations_analytics` permission |

---

## Benefits

1. **Granular Control**: Leadership can be restricted to their assigned location(s)
2. **Permission-Based Override**: Grant `view_all_locations_analytics` to unlock cross-location access
3. **Super Admin Bypass**: Super admins always have full access
4. **Graceful Degradation**: Single-location users see a clean UI without unnecessary dropdowns
5. **Extensible**: Same pattern can apply to other location-sensitive features

---

## Edge Cases

- **No location assigned**: Falls back to "All Locations" to prevent empty state
- **View As mode**: Uses the simulated role's permissions, not the actual user's
- **Multiple roles**: If any role has `view_all_locations_analytics`, user gets full access
- **Location deleted**: Filter gracefully handles missing locations in user's list
