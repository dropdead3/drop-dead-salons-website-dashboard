

# Consolidate Team Tools into Management Section

## Overview

The **Team Tools** section currently exists as a standalone navigation section with 4 items. This will be merged into the **Management** section as a new collapsible sub-group called "Team Tools", following the same pattern as the existing Analytics, People, and Operations sub-groups.

---

## Current Structure

### Team Tools Section (Standalone)
| Item | Path | Roles |
|------|------|-------|
| Shift Swaps | `/dashboard/shift-swaps` | stylist, stylist_assistant, receptionist, booth_renter |
| Rewards | `/dashboard/rewards` | All roles |
| Assistant Schedule | `/dashboard/assistant-schedule` | permission: view_assistant_schedule |
| Meetings & Accountability | `/dashboard/schedule-meeting` | permission: schedule_meetings |

### Management Section Sub-Groups
| Group | Items |
|-------|-------|
| Analytics & Insights | Analytics Hub, Team Stats, Team Leaderboard |
| People | Team Directory, Client Directory, Program Team Overview |
| Operations | Management Hub, Payroll Hub, Renter Hub, Website Editor |

---

## Proposed Structure

### Management Section (Consolidated)
| Group | Items |
|-------|-------|
| Analytics & Insights | Analytics Hub, Team Stats, Team Leaderboard |
| People | Team Directory, Client Directory, Program Team Overview |
| Operations | Management Hub, Payroll Hub, Renter Hub, Website Editor |
| **Team Tools (NEW)** | Shift Swaps, Rewards, Assistant Schedule, Meetings & Accountability |

---

## Files to Modify

### 1. `src/hooks/useSidebarLayout.ts`

#### Remove `teamTools` from DEFAULT_SECTION_ORDER
```typescript
// Before
export const DEFAULT_SECTION_ORDER = [
  'main',
  'growth',
  'stats',
  'teamTools',  // Remove this
  'manager',
  'adminOnly',
  'platform',
];

// After
export const DEFAULT_SECTION_ORDER = [
  'main',
  'growth',
  'stats',
  'manager',
  'adminOnly',
  'platform',
];
```

#### Add Team Tools to MANAGEMENT_SUB_GROUPS
```typescript
export const MANAGEMENT_SUB_GROUPS = {
  analytics: { ... },
  people: { ... },
  operations: { ... },
  teamTools: {
    id: 'teamTools',
    label: 'Team Tools',
    links: [
      '/dashboard/shift-swaps',
      '/dashboard/rewards',
      '/dashboard/assistant-schedule',
      '/dashboard/schedule-meeting',
    ],
  },
};
```

#### Add Team Tools links to manager section in DEFAULT_LINK_ORDER
```typescript
manager: [
  // Existing items...
  '/dashboard/admin/analytics',
  '/dashboard/stats',
  '/dashboard/leaderboard',
  '/dashboard/directory',
  '/dashboard/clients',
  '/dashboard/admin/team',
  '/dashboard/admin/management',
  '/dashboard/admin/payroll',
  '/dashboard/admin/booth-renters',
  '/dashboard/admin/website-sections',
  // NEW: Team Tools items
  '/dashboard/shift-swaps',
  '/dashboard/rewards',
  '/dashboard/assistant-schedule',
  '/dashboard/schedule-meeting',
],
```

---

### 2. `src/components/dashboard/DashboardLayout.tsx`

#### Move Team Tools items to managerNavItems
```typescript
// Remove teamToolsNavItems array (lines 162-167)
// OR keep it empty for backward compatibility

// Add these items to managerNavItems (lines 171-185)
const managerNavItems: NavItem[] = [
  // Existing Analytics & Insights...
  // Existing People...
  // Existing Operations...
  
  // Team Tools group (NEW)
  { href: '/dashboard/shift-swaps', label: 'Shift Swaps', icon: ArrowLeftRight, roles: ['stylist', 'stylist_assistant', 'receptionist', 'booth_renter'] },
  { href: '/dashboard/rewards', label: 'Rewards', icon: Gift },
  { href: '/dashboard/assistant-schedule', label: 'Assistant Schedule', icon: Users, permission: 'view_assistant_schedule' },
  { href: '/dashboard/schedule-meeting', label: 'Meetings & Accountability', icon: CalendarClock, permission: 'schedule_meetings' },
];
```

#### Update teamToolsNavItems to be empty
```typescript
// Keep for backward compatibility but empty
const teamToolsNavItems: NavItem[] = [];
```

---

### 3. `src/components/dashboard/SidebarNavContent.tsx`

#### Add Team Tools to buildManagementSubGroups function
```typescript
const buildManagementSubGroups = (): NavSubGroup[] => {
  const groups: NavSubGroup[] = [];
  
  // Team Tools group - show FIRST for better visibility to staff
  const teamToolsItems = filteredItems.filter(item => 
    MANAGEMENT_SUB_GROUPS.teamTools.links.includes(item.href)
  );
  if (teamToolsItems.length > 0) {
    groups.push({
      id: 'teamTools',
      label: MANAGEMENT_SUB_GROUPS.teamTools.label,
      icon: Briefcase,  // Or another suitable icon
      items: teamToolsItems,
    });
  }
  
  // Analytics & Insights group
  const analyticsItems = ...
  
  // People group  
  const peopleItems = ...
  
  // Operations group
  const operationsItems = ...
  
  return groups;
};
```

#### Import required icons
Add any missing icons to the imports (e.g., `Briefcase` or `Users` for Team Tools group icon).

---

## Visual Result

```text
+------------------------------------------+
| MANAGEMENT                               |
+------------------------------------------+
| > Team Tools                             |
|     Shift Swaps                          |
|     Rewards                              |
|     Assistant Schedule                   |
|     Meetings & Accountability            |
| > Analytics & Insights                   |
|     Analytics Hub                        |
|     Team Stats                           |
|     Team Leaderboard                     |
| > People                                 |
|     Team Directory                       |
|     Client Directory                     |
|     Program Team Overview                |
| > Operations                             |
|     Management Hub                       |
|     Payroll Hub                          |
|     Renter Hub                           |
|     Website Editor                       |
+------------------------------------------+
```

---

## Backward Compatibility

The consolidation maintains backward compatibility by:
1. Keeping `teamTools` in `SECTION_LABELS` for any stored configurations
2. Gracefully handling empty `teamToolsNavItems` in existing code
3. Using the same permission/role checks on the moved items

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/hooks/useSidebarLayout.ts` | Remove `teamTools` from section order, add to MANAGEMENT_SUB_GROUPS, update DEFAULT_LINK_ORDER |
| `src/components/dashboard/DashboardLayout.tsx` | Move Team Tools items to managerNavItems, empty teamToolsNavItems |
| `src/components/dashboard/SidebarNavContent.tsx` | Add Team Tools sub-group to buildManagementSubGroups() |

