

# Rename Admin Section and Access Hub

## Overview

Two simple rename changes to improve clarity in the navigation:
1. **Admin** section → **Access & Permissions**
2. **Access Hub** → **Access & Permissions Hub**

---

## Changes Required

### 1. Rename Section Label

**File:** `src/hooks/useSidebarLayout.ts`

Update the `SECTION_LABELS` constant:

```typescript
// Before
admin: 'Admin',

// After
admin: 'Access & Permissions',
```

---

### 2. Rename Access Hub Nav Item

**File:** `src/components/dashboard/DashboardLayout.tsx`

Update the label in `adminOnlyNavItems`:

```typescript
// Before
{ href: '/dashboard/admin/access-hub', label: 'Access Hub', icon: Shield, permission: 'manage_settings' },

// After
{ href: '/dashboard/admin/access-hub', label: 'Access & Permissions Hub', icon: Shield, permission: 'manage_settings' },
```

---

### 3. Update Sidebar Preview Reference

**File:** `src/components/dashboard/settings/SidebarPreview.tsx`

Update the `LINK_CONFIG` entry:

```typescript
// Before
'/dashboard/admin/access-hub': { label: 'Access Hub' },

// After
'/dashboard/admin/access-hub': { label: 'Access & Permissions Hub' },
```

---

### 4. Update Sidebar Layout Editor Reference

**File:** `src/components/dashboard/settings/SidebarLayoutEditor.tsx`

Update the `LINK_CONFIG` entry:

```typescript
// Before
'/dashboard/admin/access-hub': { label: 'Access Hub', icon: Shield },

// After
'/dashboard/admin/access-hub': { label: 'Access & Permissions Hub', icon: Shield },
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useSidebarLayout.ts` | Section label: Admin → Access & Permissions |
| `src/components/dashboard/DashboardLayout.tsx` | Nav item label: Access Hub → Access & Permissions Hub |
| `src/components/dashboard/settings/SidebarPreview.tsx` | Preview label update |
| `src/components/dashboard/settings/SidebarLayoutEditor.tsx` | Editor label update |

---

## Result

| Before | After |
|--------|-------|
| **Admin** section | **Access & Permissions** section |
| Access Hub | Access & Permissions Hub |

