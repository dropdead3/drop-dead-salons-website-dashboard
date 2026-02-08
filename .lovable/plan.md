
# Restrict Reward Shop to Service Providers & Sales Roles

## Overview

The **Reward Shop** page will be restricted to only be visible and accessible by:
- **Stylists**
- **Stylist Assistants**
- **Front Desk (receptionist)**

These roles represent service providers and sales people who earn and redeem points.

---

## Current State

| Component | Current Configuration |
|-----------|----------------------|
| Route (`/dashboard/rewards`) | No specific permission or role check |
| Nav Item | No role restriction (visible to all roles) |

---

## Changes Required

### 1. Add Role Restriction to Navigation

**File:** `src/components/dashboard/DashboardLayout.tsx`

Update the Rewards item in `managerNavItems` to restrict by role:

```typescript
// Before (line 169)
{ href: '/dashboard/rewards', label: 'Rewards', icon: Gift },

// After
{ href: '/dashboard/rewards', label: 'Rewards', icon: Gift, roles: ['stylist', 'stylist_assistant', 'receptionist'] },
```

This ensures the nav link only appears for these three roles.

---

### 2. Add Role Restriction to Route

**File:** `src/App.tsx`

The route currently has no permission check. We need to add a custom permission or use role-based logic.

**Option A - Create a new permission** (recommended for flexibility):
Add a `view_reward_shop` permission and assign it to the target roles.

**Option B - Direct role check** (simpler, but less flexible):
Modify the route to check for specific roles.

For simplicity and to avoid database changes, we'll add role-based protection directly. However, the `ProtectedRoute` component currently doesn't support a `roles` prop for route protection (it only uses permissions).

**Recommended approach:** Create a simple `view_reward_shop` permission. This aligns with the existing permission-based system.

---

### Technical Details

Since the ProtectedRoute doesn't support direct role checks for routes, and the nav already filters based on roles, we have two options:

**Option 1 - Add permission to database** (proper approach):
1. Create `view_reward_shop` permission
2. Assign to `stylist`, `stylist_assistant`, `receptionist` roles
3. Update route: `<ProtectedRoute requiredPermission="view_reward_shop">`
4. Update nav item to use permission instead of roles

**Option 2 - Nav-only restriction** (quick fix):
Only restrict the navigation visibility. The route would still be technically accessible via direct URL, but since it's a points redemption page and RLS controls data access, this is acceptable.

---

## Recommended Implementation

Use the nav-only approach for now (it's consistent with how other nav items work, like `shift-swaps` which also uses role filtering):

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardLayout.tsx` | Add `roles: ['stylist', 'stylist_assistant', 'receptionist']` to Rewards nav item |

This is identical to how `shift-swaps` is configured (line 168):
```typescript
{ href: '/dashboard/shift-swaps', label: 'Shift Swaps', icon: ArrowLeftRight, roles: ['stylist', 'stylist_assistant', 'receptionist', 'booth_renter'] },
```

The page data (points balance, rewards catalog) is already protected by RLS at the database level, so even if someone navigates directly, they'll only see their own data.

---

## Result

| Role | Can See Rewards Nav | Can Access Page |
|------|---------------------|-----------------|
| Stylist | Yes | Yes |
| Stylist Assistant | Yes | Yes |
| Receptionist (Front Desk) | Yes | Yes |
| All other roles | No | No (nav hidden) |
