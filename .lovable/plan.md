
# Combine Team Tools & Get Help Sections

## Overview

Merge the "Team Tools" and "Get Help" sections into a single "Team Tools" section containing all four navigation items.

---

## Changes Required

### 1. Update `src/hooks/useSidebarLayout.ts`

**Remove `getHelp` from DEFAULT_SECTION_ORDER:**
```typescript
export const DEFAULT_SECTION_ORDER = [
  'main',
  'growth', 
  'stats',
  'teamTools',    // Combined section
  // 'getHelp' - REMOVED
  'housekeeping',
  'manager',
  'website',
  'adminOnly',
  'platform',
];
```

**Remove `getHelp` from SECTION_LABELS:**
```typescript
export const SECTION_LABELS: Record<string, string> = {
  main: 'Main',
  growth: 'Growth',
  stats: 'Stats & Leaderboard',
  teamTools: 'Team Tools',
  // getHelp: 'Get Help' - REMOVED
  housekeeping: 'Housekeeping',
  // ... rest stays same
};
```

**Merge links in DEFAULT_LINK_ORDER:**
```typescript
teamTools: [
  '/dashboard/shift-swaps',
  '/dashboard/rewards',
  '/dashboard/assistant-schedule',
  '/dashboard/schedule-meeting',
],
// Remove the separate getHelp entry
```

---

### 2. Update `src/components/dashboard/DashboardLayout.tsx`

**Merge `baseGetHelpNavItems` into `teamToolsNavItems`:**
```typescript
const teamToolsNavItems: NavItem[] = [
  { href: '/dashboard/shift-swaps', label: 'Shift Swaps', icon: ArrowLeftRight, roles: ['stylist', 'stylist_assistant', 'receptionist', 'booth_renter'] },
  { href: '/dashboard/rewards', label: 'Rewards', icon: Gift },
  { href: '/dashboard/assistant-schedule', label: 'Assistant Schedule', icon: Users, permission: 'view_assistant_schedule' },
  { href: '/dashboard/schedule-meeting', label: 'Schedule 1:1 Meeting', icon: CalendarClock, permission: 'schedule_meetings' },
];
```

**Remove separate `getHelpNavItems` prop** from `SidebarNavContent` component calls.

---

### 3. Update `src/components/dashboard/SidebarNavContent.tsx`

- Remove `getHelpNavItems` from props interface
- Remove `getHelp` from `sectionItemsMap`
- Remove from `allNavItemsByHref` spread
- Remove from dependency arrays

---

### 4. Update `src/components/dashboard/settings/SidebarPreview.tsx`

Ensure both Assistant Schedule and Schedule 1:1 Meeting are in the `LINK_CONFIG`:
```typescript
'/dashboard/assistant-schedule': { label: 'Assistant Schedule' },
'/dashboard/schedule-meeting': { label: 'Schedule 1:1 Meeting' },
```

---

## Result

The sidebar will show a single **"Team Tools"** section containing:
1. Shift Swaps
2. Rewards
3. Assistant Schedule
4. Schedule 1:1 Meeting

All items remain individually configurable via the Role Access Configurator.
