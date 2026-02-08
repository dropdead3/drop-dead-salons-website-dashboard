

# Consolidate "Manage Users & Roles" into Access Hub

## Overview

Merge the "Manage Users & Roles" page into the Access Hub to create a single, unified destination for all access control administration. This eliminates confusion from duplicate Permissions tabs and creates a cleaner navigation structure.

---

## New Access Hub Structure (6 Tabs)

| Tab | Icon | Description | Source |
|-----|------|-------------|--------|
| Modules | Blocks | Organization feature toggles | Existing |
| User Roles | Users | Assign roles to team members | ManageRoles.tsx (Users tab) |
| Role Access | Eye | UI visibility per role | Existing |
| Permissions | Lock | Action-based permissions | Existing (consolidates duplicate) |
| Role Config | Settings2 | Role CRUD, templates, defaults | ManageRoles.tsx (Manage, Templates, Defaults tabs) |
| Platform | Flag | Platform user management | Existing |

---

## Implementation Steps

### Step 1: Create UserRolesTab Component

**New file:** `src/components/access-hub/UserRolesTab.tsx`

Extract the "User Roles" tab content from ManageRoles.tsx (~lines 240-513), including:
- Role statistics overview cards
- User search functionality
- User cards with role toggles
- Super Admin confirmation dialog
- Role history panel per user

This component will use the existing hooks:
- `useAllUsersWithRoles`
- `useToggleUserRole`
- `useCanApproveAdmin`
- `useAccountApprovals`
- `useToggleSuperAdmin`

---

### Step 2: Create RoleConfigTab Component

**New file:** `src/components/access-hub/RoleConfigTab.tsx`

Combine the "Manage", "Templates", and "Defaults" tabs into a single component with sub-tabs:
- **Roles** - Uses existing `RoleEditor` component
- **Templates** - Uses existing `RoleTemplatesManager` component
- **Defaults** - Uses existing `SystemDefaultsConfigurator` component

This keeps the existing components but wraps them in a clean sub-tab interface.

---

### Step 3: Update AccessHub.tsx

Update the main AccessHub page:
- Expand `TabValue` type to include `'user-roles'` and `'role-config'`
- Import the two new tab components
- Update `TabsList` from 4 columns to 6 columns
- Add the new `TabsContent` sections

---

### Step 4: Update Navigation

**File:** `src/components/dashboard/DashboardLayout.tsx`

Remove "Manage Users & Roles" from `adminOnlyNavItems`:

```typescript
const adminOnlyNavItems: NavItem[] = [
  { href: '/dashboard/admin/accounts', label: 'Invitations & Approvals', ... },
  // Remove: { href: '/dashboard/admin/roles', label: 'Manage Users & Roles', ... },
  { href: '/dashboard/admin/access-hub', label: 'Access Hub', ... },
];
```

---

### Step 5: Add URL Redirect

**File:** `src/App.tsx`

Add redirect for users with bookmarks to the old URL:

```typescript
<Route 
  path="/dashboard/admin/roles" 
  element={<Navigate to="/dashboard/admin/access-hub?tab=user-roles" replace />} 
/>
```

---

### Step 6: Clean Up (After Verification)

After confirming everything works:
- Delete `src/pages/dashboard/admin/ManageRoles.tsx`
- The components it used (`RoleEditor`, `RoleTemplatesManager`, `SystemDefaultsConfigurator`) remain in place since they're reused

---

## Files Summary

| File | Action |
|------|--------|
| `src/components/access-hub/UserRolesTab.tsx` | Create |
| `src/components/access-hub/RoleConfigTab.tsx` | Create |
| `src/components/access-hub/index.ts` | Update exports |
| `src/pages/dashboard/admin/AccessHub.tsx` | Add 2 new tabs |
| `src/components/dashboard/DashboardLayout.tsx` | Remove "Manage Users & Roles" nav |
| `src/App.tsx` | Add redirect from old URL |
| `src/pages/dashboard/admin/ManageRoles.tsx` | Delete (final step) |

---

## Visual Result

### Before (Sidebar)
```
SUPER ADMIN
├── Invitations & Approvals
├── Manage Users & Roles     ← Redundant
└── Access Hub               ← Incomplete

Settings
```

### After (Sidebar)
```
SUPER ADMIN
├── Invitations & Approvals
└── Access Hub               ← All-in-one

Settings
```

### After (Access Hub Tabs)
```
[Modules] [User Roles] [Role Access] [Permissions] [Role Config] [Platform]
```

---

## Benefits

1. Single destination for all access management
2. No duplicate "Permissions" tabs causing confusion
3. Cleaner sidebar with fewer admin links
4. Consistent with hub pattern (Management Hub, Analytics Hub, etc.)
5. Old bookmarks still work via redirect

