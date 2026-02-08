
# Consolidate Staff Account Invitations into Access Hub

## Overview

The **Staff Account Invitations** page (`/dashboard/admin/accounts`) will be consolidated into the **Access Hub** as a new tab called "Invitations". This follows the pattern of consolidating access-related functionality into the central Access Hub.

---

## Current State

### Staff Account Invitations Page
- **Route**: `/dashboard/admin/accounts`
- **Component**: `AccountManagement.tsx`
- **Features**:
  - Staff invitations (send, resend, cancel)
  - Account approvals (approve/reject)
  - QR code for staff signup
  - Stats cards (pending invites, needs approval, etc.)
  - Two main tabs: Invitations & Approvals

### Access Hub Tabs
| Tab | Component | Purpose |
|-----|-----------|---------|
| Modules | `ModulesTab` | Feature toggles |
| User Roles | `UserRolesTab` | Assign roles to users |
| Role Access | `RoleAccessTab` | UI visibility settings |
| Permissions | `PermissionsTab` | Functional capabilities |
| Role Config | `RoleConfigTab` | CRUD for roles/templates |

---

## Changes Required

### 1. Create New InvitationsTab Component

**New File**: `src/components/access-hub/InvitationsTab.tsx`

Extract the invitation and approval functionality from `AccountManagement.tsx` into a new tab component that follows the Access Hub pattern:
- Remove the `DashboardLayout` wrapper
- Keep all existing functionality (invitations, approvals, QR code, stats)
- Accept `canManage` prop like other tabs

---

### 2. Update Access Hub Page

**File**: `src/pages/dashboard/admin/AccessHub.tsx`

Add the new "Invitations" tab:

```typescript
type TabValue = 'modules' | 'user-roles' | 'role-access' | 'permissions' | 'role-config' | 'invitations';
```

Add to imports and TabsList:
```typescript
import { InvitationsTab } from '@/components/access-hub/InvitationsTab';

// Add UserPlus icon
<TabsTrigger value="invitations" className="gap-2">
  <UserPlus className="h-4 w-4" />
  <span className="hidden sm:inline">Invitations</span>
</TabsTrigger>

<TabsContent value="invitations" className="mt-0">
  <InvitationsTab canManage={canManage} />
</TabsContent>
```

Update grid columns from 5 to 6: `grid-cols-6`

---

### 3. Update Index Exports

**File**: `src/components/access-hub/index.ts`

```typescript
export { InvitationsTab } from './InvitationsTab';
```

---

### 4. Remove Staff Account Invitations from Navigation

**File**: `src/components/dashboard/DashboardLayout.tsx`

Remove from `adminOnlyNavItems`:
```typescript
// Before
const adminOnlyNavItems: NavItem[] = [
  { href: '/dashboard/admin/accounts', label: 'Staff Account Invitations', icon: UserPlus, permission: 'approve_accounts' },
  { href: '/dashboard/admin/access-hub', label: 'Access Hub', icon: Shield, permission: 'manage_settings' },
];

// After
const adminOnlyNavItems: NavItem[] = [
  { href: '/dashboard/admin/access-hub', label: 'Access Hub', icon: Shield, permission: 'manage_settings' },
];
```

---

### 5. Add Redirect for Old Route

**File**: `src/App.tsx`

Replace the standalone route with a redirect to Access Hub:
```typescript
// Before
<Route path="/dashboard/admin/accounts" element={<ProtectedRoute requiredPermission="approve_accounts"><AccountManagement /></ProtectedRoute>} />

// After
<Route path="/dashboard/admin/accounts" element={<Navigate to="/dashboard/admin/access-hub?tab=invitations" replace />} />
```

---

### 6. Update UserRolesTab Links

**File**: `src/components/access-hub/UserRolesTab.tsx`

Update the links that point to external pages (lines 248-260):
```typescript
// Before
<Link to="/dashboard/admin/invitations">
  <UserPlus className="w-4 h-4" />
  Invite Staff Member
</Link>
<Link to="/dashboard/admin/approvals">
  Account Approvals
  <ArrowRight className="w-4 h-4" />
</Link>

// After - Remove these buttons since functionality is now in Invitations tab
// Or update to use tab navigation within Access Hub
```

---

### 7. Update Sidebar Preview/Editor Labels

**Files**: 
- `src/components/dashboard/settings/SidebarPreview.tsx`
- `src/components/dashboard/settings/SidebarLayoutEditor.tsx`

Remove or update references to `/dashboard/admin/accounts`.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/access-hub/InvitationsTab.tsx` | **NEW** - Extract from AccountManagement |
| `src/components/access-hub/index.ts` | Add InvitationsTab export |
| `src/pages/dashboard/admin/AccessHub.tsx` | Add Invitations tab |
| `src/components/dashboard/DashboardLayout.tsx` | Remove nav item |
| `src/App.tsx` | Replace route with redirect |
| `src/components/access-hub/UserRolesTab.tsx` | Update/remove external links |
| `src/components/dashboard/settings/SidebarPreview.tsx` | Remove accounts reference |
| `src/components/dashboard/settings/SidebarLayoutEditor.tsx` | Remove accounts reference |

---

## Result

### Access Hub Tabs (After)
| Tab | Icon | Purpose |
|-----|------|---------|
| Modules | Blocks | Feature toggles |
| User Roles | Users | Assign roles to users |
| Role Access | Eye | UI visibility settings |
| Permissions | Lock | Functional capabilities |
| Role Config | Settings2 | CRUD for roles/templates |
| **Invitations** | **UserPlus** | **Staff invitations & approvals** |

### Navigation (After)
The Admin section will have only one link:
- Access Hub (contains all access-related functionality)

Old URL `/dashboard/admin/accounts` will redirect to `/dashboard/admin/access-hub?tab=invitations`.
