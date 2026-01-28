
# Segment Announcements by Location

## Overview

Implement announcement segmentation to support both **company-wide** and **location-specific** announcements. Users will see:
1. All company-wide announcements (regardless of their assigned location)
2. Location-specific announcements that match their assigned location(s)

---

## Current State

- **Announcements table**: No `location_id` column - all announcements are visible to everyone
- **User location assignments**: Stored in `employee_profiles.location_id` (single) and `employee_profiles.location_ids` (array)
- **Location access hook**: `useUserLocationAccess` already provides `assignedLocationIds` array

---

## Implementation Plan

### 1. Database Schema Update

Add a nullable `location_id` column to the `announcements` table:
- `NULL` = Company-wide announcement (visible to all users)
- UUID value = Location-specific announcement (visible only to users at that location)

```sql
ALTER TABLE public.announcements 
ADD COLUMN location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.announcements.location_id IS 
  'NULL for company-wide announcements; set to a location UUID to restrict visibility';
```

### 2. Admin UI: Announcement Form Update

**File: `src/pages/dashboard/admin/Announcements.tsx`**

Add a location selector to the `AnnouncementForm` component:

- Import `useActiveLocations` hook
- Add new state: `locationId` (string | null)
- Add a dropdown with options:
  - "All Locations (Company-Wide)" - value: empty/null
  - Each active location listed by name
- Pass `location_id` in create/update mutations

```text
Form Layout:
┌─────────────────────────────────────────────────────────┐
│  Title: [__________________________________________]    │
│  Content: [_______________________________________]     │
│                                                         │
│  Priority: [Normal ▼]    Expires: [Date picker]        │
│                                                         │
│  Audience: [All Locations (Company-Wide) ▼]            │  <-- NEW FIELD
│            Options:                                     │
│            - All Locations (Company-Wide)               │
│            - Dallas                                     │
│            - Austin                                     │
│            - Houston                                    │
│                                                         │
│  [☐] Pin to top                                        │
│  [Create Announcement]                                  │
└─────────────────────────────────────────────────────────┘
```

### 3. Announcement Queries: Location Filtering

Update all announcement fetch queries to filter based on user's assigned locations.

**Files to update:**
- `src/pages/dashboard/DashboardHome.tsx` (main dashboard)
- `src/components/dashboard/SidebarAnnouncementsWidget.tsx` (sidebar widget)
- `src/components/dashboard/NotificationsPanel.tsx` (notification dropdown)
- `src/hooks/useUnreadAnnouncements.ts` (unread count)

**Filter logic:**
```sql
-- Show announcements where:
-- 1. location_id IS NULL (company-wide), OR
-- 2. location_id is in the user's assigned locations

.or(`location_id.is.null,location_id.in.(${assignedLocationIds.join(',')})`)
```

For super admins and users with `view_all_locations_analytics` permission, show all announcements.

### 4. Admin View: Show All Announcements

**File: `src/pages/dashboard/admin/Announcements.tsx`**

The admin management page should continue to show ALL announcements (for editing purposes) but display a location badge on each card to indicate targeting.

---

## Files to Modify

| File | Changes |
|------|---------|
| **Database Migration** | Add `location_id` column to `announcements` table |
| `src/pages/dashboard/admin/Announcements.tsx` | Add location selector to form; display location badge on cards |
| `src/pages/dashboard/DashboardHome.tsx` | Filter announcements by user's assigned locations |
| `src/components/dashboard/SidebarAnnouncementsWidget.tsx` | Filter announcements by user's assigned locations |
| `src/components/dashboard/NotificationsPanel.tsx` | Filter announcements by user's assigned locations |
| `src/hooks/useUnreadAnnouncements.ts` | Filter unread count by user's assigned locations |
| `src/components/dashboard/AnnouncementsBento.tsx` | Update interface to include location_id; optionally show location badge |

---

## Technical Details

### Query Pattern for Filtered Announcements

```typescript
// In components that fetch announcements
import { useUserLocationAccess } from '@/hooks/useUserLocationAccess';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';

// Inside component:
const { assignedLocationIds, canViewAllLocations } = useUserLocationAccess();

const { data: announcements } = useQuery({
  queryKey: ['announcements', user?.id, assignedLocationIds],
  queryFn: async () => {
    let query = supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()');

    // Super admins see all; others filter by location
    if (!canViewAllLocations && assignedLocationIds.length > 0) {
      query = query.or(
        `location_id.is.null,location_id.in.(${assignedLocationIds.join(',')})`
      );
    }

    const { data, error } = await query
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
});
```

### AnnouncementForm Props Update

```typescript
interface AnnouncementFormProps {
  // ... existing props
  locationId: string | null;
  setLocationId: (v: string | null) => void;
}
```

### Location Badge on Announcement Cards

Add a visual indicator showing which location an announcement targets:
- "Company-Wide" badge for `location_id = null`
- Location name badge for location-specific announcements

---

## User Experience

| User Type | What They See |
|-----------|---------------|
| **Super Admin** | All announcements (company-wide + all locations) |
| **User assigned to Dallas** | Company-wide + Dallas-only announcements |
| **User assigned to multiple locations** | Company-wide + announcements for all their locations |
| **Leadership (when creating)** | Can target company-wide OR any specific location |

---

## Summary of Changes

1. **Database**: Add `location_id` column (nullable FK to locations)
2. **Admin Form**: Add "Audience" location selector dropdown
3. **Dashboard/Widget/Notifications**: Filter announcements by user's assigned locations
4. **Unread Count**: Calculate based on filtered announcements only
5. **Admin List View**: Show location badge on each announcement card
