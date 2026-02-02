

# Move Analytics Hub to Top of Navigation

## Overview

Move the **Analytics Hub** from the "Stats & Leaderboard" section to the top of the navigation bar, positioning it directly after "Command Center".

---

## Changes Summary

| Change | Description |
|--------|-------------|
| Add to mainNavItems | Insert Analytics Hub as the second item after Command Center |
| Remove from statsNavItems | Remove Analytics Hub from the Stats & Leaderboard section |

---

## Technical Details

### File: `src/components/dashboard/DashboardLayout.tsx`

**1. Update `mainNavItems` (line 133-138)**

Add Analytics Hub right after Command Center:

```typescript
const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard, permission: 'view_command_center' },
  { href: '/dashboard/admin/analytics', label: 'Analytics Hub', icon: TrendingUp, permission: 'view_team_overview' },  // <-- ADD HERE
  { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarDays, permission: 'view_booking_calendar' },
  { href: '/dashboard/directory', label: 'Team Directory', icon: Contact, permission: 'view_team_directory' },
  { href: '/dashboard/clients', label: 'Client Directory', icon: Users, permission: 'view_clients' },
];
```

**2. Update `statsNavItems` (lines 162-167)**

Remove Analytics Hub from this section:

```typescript
const statsNavItems: NavItem[] = [
  { href: '/dashboard/stats', label: 'My Stats', icon: BarChart3, permission: 'view_own_stats', roles: ['stylist', 'stylist_assistant'] },
  { href: '/dashboard/leaderboard', label: 'Team Leaderboard', icon: Trophy, permission: 'view_leaderboard' },
  { href: '/dashboard/my-pay', label: 'My Pay', icon: Wallet, permission: 'view_my_pay' },
  // Analytics Hub removed from here
];
```

---

## Result

The navigation order will be:
1. **Command Center** 
2. **Analytics Hub** (moved here)
3. Schedule
4. Team Directory
5. Client Directory

Analytics Hub will be visible to users with the `view_team_overview` permission, same as before.

