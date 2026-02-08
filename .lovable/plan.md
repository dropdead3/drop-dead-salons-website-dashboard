
# Move Schedule to Team Tools for Account Owners & Rename Assistant Schedule

## Overview

For account owners (`super_admin` role), the **Schedule** navigation link will be moved from the Main section into the **Team Tools** sub-group under Management. Additionally, **Assistant Schedule** will be renamed to **Assistant Scheduling** for all users.

---

## Current Behavior

| Item | Location | Visibility |
|------|----------|------------|
| Schedule | Main section | All users with `view_booking_calendar` permission |
| Assistant Schedule | Team Tools sub-group | Users with `view_assistant_schedule` permission |

---

## Changes Required

### 1. Rename Assistant Schedule to Assistant Scheduling

**File:** `src/components/dashboard/DashboardLayout.tsx`

Update the label in `managerNavItems`:

```typescript
// Line 169 - Before
{ href: '/dashboard/assistant-schedule', label: 'Assistant Schedule', icon: Users, permission: 'view_assistant_schedule' },

// After
{ href: '/dashboard/assistant-schedule', label: 'Assistant Scheduling', icon: Users, permission: 'view_assistant_schedule' },
```

---

### 2. Add Schedule to managerNavItems for Team Tools

**File:** `src/components/dashboard/DashboardLayout.tsx`

Add the Schedule item to `managerNavItems` (it will be filtered to Team Tools sub-group):

```typescript
const managerNavItems: NavItem[] = [
  // Team Tools group (moved from standalone section)
  { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarDays, permission: 'view_booking_calendar', roles: ['super_admin'] }, // NEW: For super_admin only in Team Tools
  { href: '/dashboard/shift-swaps', label: 'Shift Swaps', icon: ArrowLeftRight, roles: ['stylist', 'stylist_assistant', 'receptionist', 'booth_renter'] },
  { href: '/dashboard/rewards', label: 'Rewards', icon: Gift },
  { href: '/dashboard/assistant-schedule', label: 'Assistant Scheduling', icon: Users, permission: 'view_assistant_schedule' },
  // ... rest of items
];
```

---

### 3. Add Schedule path to Team Tools sub-group

**File:** `src/hooks/useSidebarLayout.ts`

Update `MANAGEMENT_SUB_GROUPS.teamTools.links` to include the schedule path:

```typescript
teamTools: {
  id: 'teamTools',
  label: 'Team Tools',
  links: [
    '/dashboard/schedule',           // NEW
    '/dashboard/shift-swaps',
    '/dashboard/rewards',
    '/dashboard/assistant-schedule',
    '/dashboard/schedule-meeting',
  ],
},
```

Also update `DEFAULT_LINK_ORDER.manager` to include the schedule path:

```typescript
manager: [
  '/dashboard/schedule',            // NEW
  '/dashboard/shift-swaps',
  // ... rest
],
```

---

### 4. Hide Schedule from Main section for super_admin

**File:** `src/components/dashboard/DashboardLayout.tsx`

Update `mainNavItems` to exclude `super_admin` from the Schedule item's roles:

```typescript
const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard, permission: 'view_command_center' },
  { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarDays, permission: 'view_booking_calendar', roles: ['admin', 'manager', 'stylist', 'stylist_assistant', 'receptionist', 'assistant', 'admin_assistant', 'operations_assistant', 'booth_renter', 'bookkeeper'] },
];
```

This explicitly lists all roles EXCEPT `super_admin`, so account owners won't see Schedule in Main but will see it in Team Tools.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/DashboardLayout.tsx` | Rename Assistant Schedule, add Schedule to managerNavItems for super_admin, restrict mainNavItems Schedule from super_admin |
| `src/hooks/useSidebarLayout.ts` | Add `/dashboard/schedule` to Team Tools links and DEFAULT_LINK_ORDER.manager |

---

## Result

| Role | Schedule Location |
|------|------------------|
| `super_admin` (Account Owner) | Management → Team Tools |
| All other roles | Main section |

| Before | After |
|--------|-------|
| Assistant Schedule | Assistant Scheduling |
