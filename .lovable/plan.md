
# Move Team Stats & Leaderboard to Management Section for Admins

## Overview

For admin and manager roles, the "Team Stats" and "Team Leaderboard" navigation links will appear under the "Management" section instead of the "Stats & Leaderboard" section. Non-admin users will continue to see "My Stats" and "Team Leaderboard" in the Stats section.

---

## Approach

The cleanest approach is to:
1. Add "Team Stats" and "Team Leaderboard" links to the `managerNavItems` array (visible only to admins/managers)
2. Update the `statsNavItems` array to exclude admin roles from seeing these items there
3. Update the default link order configuration to include these links in the manager section
4. Update sidebar preview for the settings configurator

---

## Changes

### File: `src/components/dashboard/DashboardLayout.tsx`

**1. Update `statsNavItems` to exclude admin roles from stats/leaderboard:**

```typescript
const statsNavItems: NavItem[] = [
  { 
    href: '/dashboard/stats', 
    label: 'My Stats', 
    icon: BarChart3, 
    permission: 'view_own_stats', 
    roles: ['stylist', 'stylist_assistant'] // Remove admin, super_admin, manager
  },
  { 
    href: '/dashboard/leaderboard', 
    label: 'Team Leaderboard', 
    icon: Trophy, 
    permission: 'view_leaderboard',
    roles: ['stylist', 'stylist_assistant', 'receptionist', 'booth_renter'] // Exclude admins
  },
  { href: '/dashboard/my-pay', label: 'My Pay', icon: Wallet, permission: 'view_my_pay' },
];
```

**2. Add Team Stats and Team Leaderboard to `managerNavItems`:**

```typescript
const managerNavItems: NavItem[] = [
  { href: '/dashboard/admin/management', label: 'Management Hub', icon: LayoutGrid, permission: 'view_team_overview' },
  { href: '/dashboard/admin/analytics', label: 'Analytics Hub', icon: TrendingUp, permission: 'view_team_overview' },
  { href: '/dashboard/stats', label: 'Team Stats', icon: BarChart3, permission: 'view_all_stats' },
  { href: '/dashboard/leaderboard', label: 'Team Leaderboard', icon: Trophy, permission: 'view_leaderboard' },
  { href: '/dashboard/directory', label: 'Team Directory', icon: Contact, permission: 'view_team_directory' },
  { href: '/dashboard/clients', label: 'Client Directory', icon: Users, permission: 'view_clients' },
  { href: '/dashboard/admin/payroll', label: 'Payroll Hub', icon: DollarSign, permission: 'manage_payroll' },
  { href: '/dashboard/admin/booth-renters', label: 'Renter Hub', icon: Store, permission: 'manage_booth_renters' },
];
```

---

### File: `src/hooks/useSidebarLayout.ts`

**Update `DEFAULT_LINK_ORDER` to include the links in the manager section:**

```typescript
manager: [
  '/dashboard/admin/management',
  '/dashboard/admin/analytics',
  '/dashboard/stats',           // Add here
  '/dashboard/leaderboard',     // Add here
  '/dashboard/directory',
  '/dashboard/clients',
  '/dashboard/admin/payroll',
  '/dashboard/admin/booth-renters',
],
```

---

### File: `src/components/dashboard/settings/SidebarPreview.tsx`

**Add route labels for consistency:**

The LINK_CONFIG already has entries for both routes, but we should verify they display correctly.

---

### File: `src/components/dashboard/settings/SidebarLayoutEditor.tsx`

**Add route labels for the editor:**

Ensure the ROUTE_LABELS mapping includes entries for these routes in the manager section context.

---

## Summary of File Changes

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardLayout.tsx` | Move stats/leaderboard to managerNavItems, restrict from statsNavItems for admin roles |
| `src/hooks/useSidebarLayout.ts` | Add routes to manager section in DEFAULT_LINK_ORDER |
| `src/components/dashboard/settings/SidebarPreview.tsx` | Verify route labels (may already be complete) |
| `src/components/dashboard/settings/SidebarLayoutEditor.tsx` | Verify route labels |

---

## Result

- **Admin/Manager users**: See "Team Stats" and "Team Leaderboard" under the "Management" section
- **Stylists/Assistants**: Continue to see "My Stats" and "Team Leaderboard" in the "Stats & Leaderboard" section  
- **Other roles**: See "Team Leaderboard" in Stats section based on their permissions
