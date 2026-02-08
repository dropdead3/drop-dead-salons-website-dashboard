
# Add Location and Role Filters to Start DM Dialog

## Overview

The "Start a Conversation" dialog currently only supports text search. We'll add two dropdown filters (Location and Role) to make it easier to find team members, especially in larger organizations.

## What You'll See

- Two new filter dropdowns above the search input
- A **Location** dropdown using your existing locations (e.g., "North Mesa", "Gilbert")
- A **Role** dropdown showing all active roles (e.g., "Admin", "Manager", "Stylist")
- Filters can be combined with text search
- Filter badges showing active filters with easy clear buttons

---

## Technical Changes

### 1. Extend the useTeamMembers Hook

Update `src/hooks/team-chat/useTeamMembers.ts` to accept optional location and role parameters:

```typescript
export function useTeamMembers(
  searchQuery: string = '',
  locationId?: string,
  roleFilter?: string
) {
  // Existing query with added filters
  // - Filter by location_id if provided
  // - Join user_roles table to filter by role
}
```

Since Supabase doesn't support foreign table filtering in a single query without views, we'll:
- Fetch user_ids that match the role filter from `user_roles` table (if role filter is set)
- Apply `.in('user_id', matchingIds)` to filter employee_profiles

### 2. Update StartDMDialog Component

Update `src/components/team-chat/StartDMDialog.tsx`:

| Change | Details |
|--------|---------|
| Add state | `locationFilter` and `roleFilter` state variables |
| Add LocationSelect | Use existing `LocationSelect` component |
| Add Role Select | Build a select using roles from `useRoles` hook |
| Update hook call | Pass filters to `useTeamMembers(search, locationFilter, roleFilter)` |
| Layout | Stack filters horizontally above search input |

### Layout Preview

```text
┌─────────────────────────────────────────────┐
│ 👥 START A CONVERSATION                   ✕ │
├─────────────────────────────────────────────┤
│ ┌─────────────────┐  ┌─────────────────┐    │
│ │ 📍 All Locations │  │ 👤 All Roles    │    │
│ └─────────────────┘  └─────────────────┘    │
│ ┌─────────────────────────────────────────┐ │
│ │ 🔍 Search team members...               │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│   [Avatar] Admin Assistant Test Account     │
│            admin-assistant-test@test.com    │
│                                             │
│   [Avatar] Manager Test Account             │
│            manager-test@test.com            │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/team-chat/useTeamMembers.ts` | Add location and role filter parameters, implement role-based filtering via user_roles join |
| `src/components/team-chat/StartDMDialog.tsx` | Add filter state, LocationSelect dropdown, Role dropdown, pass filters to hook |

---

## Benefits

- Faster team member discovery in large organizations
- Consistent with filters used elsewhere (Team Directory)
- Uses existing UI components (LocationSelect, useRoles)
- Filters combine with search for precise results
