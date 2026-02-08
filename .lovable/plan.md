

# Hide Training and Onboarding from Account Owners

## Overview

Account owners (users with `super_admin` role) should not see the **Training** or **Onboarding** navigation items in the sidebar. These features are intended for staff members, not the business owner.

---

## Current Behavior

| Nav Item | Current Visibility |
|----------|-------------------|
| **Training** | `super_admin`, `admin`, `manager`, `stylist`, `stylist_assistant` |
| **Onboarding** (START HERE) | All users when onboarding incomplete |
| **Onboarding** (housekeeping) | All users when complete, OR admin/super_admin always |

---

## Changes Required

### 1. Hide Training from Super Admins

**File:** `src/components/dashboard/DashboardLayout.tsx`

Remove `super_admin` from the Training nav item's roles array:

```typescript
// Line 148 - Before
{ href: '/dashboard/training', label: 'Training', icon: Video, permission: 'view_training', roles: ['super_admin', 'admin', 'manager', 'stylist', 'stylist_assistant'] },

// After
{ href: '/dashboard/training', label: 'Training', icon: Video, permission: 'view_training', roles: ['admin', 'manager', 'stylist', 'stylist_assistant'] },
```

### 2. Hide "START HERE" Section from Super Admins

**File:** `src/components/dashboard/SidebarNavContent.tsx`

Modify the START HERE priority section to exclude `super_admin`:

```typescript
// Line 350 - Before
{!isOnboardingComplete && (

// After  
{!isOnboardingComplete && !roles.includes('super_admin') && (
```

### 3. Hide Onboarding from Housekeeping for Super Admins

**File:** `src/components/dashboard/SidebarNavContent.tsx`

Update the housekeeping section logic to always hide onboarding from super_admin:

```typescript
// Lines 469-475 - Before
const isAdminViewing = roles.includes('admin') || roles.includes('super_admin');
if (!isOnboardingComplete && !isAdminViewing) {
  filteredItems = filteredItems.filter(item => 
    item.href !== '/dashboard/onboarding'
  );
}

// After
const isSuperAdmin = roles.includes('super_admin');
// Super admins never see onboarding; admins see it in housekeeping
if (isSuperAdmin || (!isOnboardingComplete && !roles.includes('admin'))) {
  filteredItems = filteredItems.filter(item => 
    item.href !== '/dashboard/onboarding'
  );
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/DashboardLayout.tsx` | Remove `super_admin` from Training roles |
| `src/components/dashboard/SidebarNavContent.tsx` | Hide START HERE and Onboarding from super_admin |

---

## Result

After these changes:

| Nav Item | New Visibility |
|----------|---------------|
| **Training** | `admin`, `manager`, `stylist`, `stylist_assistant` (not super_admin) |
| **Onboarding** (START HERE) | All users EXCEPT `super_admin` when incomplete |
| **Onboarding** (housekeeping) | `admin` always sees it; `super_admin` never sees it |

Account owners can focus on management functions without seeing staff-oriented navigation items.

