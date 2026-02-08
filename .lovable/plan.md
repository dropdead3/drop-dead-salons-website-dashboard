

# Add Access Hub Navigation Links

## Overview
Add the **Access & Controls Hub** to two locations:
1. **Sidebar Navigation** - In the admin-only items section
2. **Quick Access Hubs** - On the dashboard Command Center

---

## Changes Required

### 1. Sidebar Navigation (`DashboardLayout.tsx`)

Add Access Hub to `adminOnlyNavItems` array (line ~188-192):

**Current:**
```typescript
const adminOnlyNavItems: NavItem[] = [
  { href: '/dashboard/admin/accounts', label: 'Invitations & Approvals', icon: UserPlus, permission: 'approve_accounts' },
  { href: '/dashboard/admin/roles', label: 'Manage Users & Roles', icon: Shield, permission: 'manage_user_roles' },
  { href: '/dashboard/admin/settings', label: 'Settings', icon: Settings, permission: 'manage_settings' },
];
```

**Updated:**
```typescript
const adminOnlyNavItems: NavItem[] = [
  { href: '/dashboard/admin/accounts', label: 'Invitations & Approvals', icon: UserPlus, permission: 'approve_accounts' },
  { href: '/dashboard/admin/roles', label: 'Manage Users & Roles', icon: Shield, permission: 'manage_user_roles' },
  { href: '/dashboard/admin/access-hub', label: 'Access Hub', icon: Shield, permission: 'manage_settings' },
  { href: '/dashboard/admin/settings', label: 'Settings', icon: Settings, permission: 'manage_settings' },
];
```

**Note:** Using `manage_settings` permission since Access Hub is for super admins who can manage organization settings.

---

### 2. Quick Access Hubs (`HubQuickLinks.tsx`)

Add Access Hub to the `hubLinks` array:

**File:** `src/components/dashboard/HubQuickLinks.tsx`

**Add import:**
```typescript
import { Shield } from 'lucide-react';
```

**Add to hubLinks array** (after Feedback Hub, before Onboarding Hub):
```typescript
{ 
  href: '/dashboard/admin/access-hub', 
  icon: Shield, 
  label: 'Access Hub', 
  colorClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20',
  permission: 'manage_settings',
},
```

---

## Visual Result

### Sidebar (Admin Section)
```
Administration
├── Invitations & Approvals
├── Manage Users & Roles
├── Access Hub          ← NEW
└── Settings
```

### Quick Access Hubs (Dashboard)
```
Quick Access Hubs
┌───────────┬────────────┬────────────┬───────────┐
│ Analytics │ Management │ Payroll    │ Renter    │
│ Hub       │ Hub        │ Hub        │ Hub       │
├───────────┼────────────┼────────────┼───────────┤
│ Website   │ Feedback   │ Access Hub │ Onboarding│
│ Editor    │ Hub        │ ← NEW      │ Hub       │
└───────────┴────────────┴────────────┴───────────┘
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardLayout.tsx` | Add Access Hub to `adminOnlyNavItems` |
| `src/components/dashboard/HubQuickLinks.tsx` | Add Shield import and Access Hub to `hubLinks` |

---

## Access Control

The Access Hub link will be visible to users with the `manage_settings` permission, which is typically:
- Super Admins
- Platform Admins (via platform context)

This aligns with the Access Hub page itself, which checks for `super_admin` role or `isPlatformUser`.

