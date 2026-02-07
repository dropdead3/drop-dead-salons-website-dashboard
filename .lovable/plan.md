
# Move Feature Flags to Platform Dashboard

## Overview

The Feature Flags management page is currently located in the staff/organization dashboard (`/dashboard/admin/feature-flags`). Since feature flags are a platform-level capability for managing functionality across all organizations, it should be moved to the Platform Admin dashboard (`/dashboard/platform/feature-flags`).

---

## Changes Required

### 1. Create New Platform Feature Flags Page

Create a new page at `src/pages/dashboard/platform/FeatureFlags.tsx` that:
- Uses `PlatformPageContainer` for consistent platform styling
- Uses platform-specific UI components (`PlatformButton`, etc.)
- Has a back button to Platform Settings
- Reuses the existing feature flag logic from hooks

### 2. Update Routes

**File: `src/App.tsx`**

| Action | Description |
|--------|-------------|
| Remove | The existing route at `/dashboard/admin/feature-flags` |
| Add | New route at `/dashboard/platform/feature-flags` inside the platform layout routes |
| Add | Import for the new Platform Feature Flags page |

### 3. Update Platform Sidebar

**File: `src/components/platform/layout/PlatformSidebar.tsx`**

Add a new navigation item for Feature Flags:

```typescript
{ 
  href: '/dashboard/platform/feature-flags', 
  label: 'Feature Flags', 
  icon: Flag, 
  platformRoles: ['platform_owner', 'platform_admin'] 
}
```

### 4. Remove from Staff Dashboard Navigation

**File: `src/components/dashboard/DashboardLayout.tsx`**

Remove the Feature Flags entry from `settingsNavItems` array.

### 5. Update Sidebar Layout Config

**File: `src/hooks/useSidebarLayout.ts`**

Remove `/dashboard/admin/feature-flags` from the `DEFAULT_LINK_ORDER.settings` array.

### 6. Clean Up Settings UI Components

**Files:**
- `src/components/dashboard/settings/SidebarPreview.tsx`
- `src/components/dashboard/settings/SidebarLayoutEditor.tsx`

Remove the Feature Flags route label mapping since it's no longer in the staff dashboard.

---

## File Summary

| File | Action |
|------|--------|
| `src/pages/dashboard/platform/FeatureFlags.tsx` | Create (new platform-styled page) |
| `src/App.tsx` | Update routes (remove old, add new platform route) |
| `src/components/platform/layout/PlatformSidebar.tsx` | Add nav item with Flag icon |
| `src/components/dashboard/DashboardLayout.tsx` | Remove from settingsNavItems |
| `src/hooks/useSidebarLayout.ts` | Remove from settings default order |
| `src/components/dashboard/settings/SidebarPreview.tsx` | Remove route label |
| `src/components/dashboard/settings/SidebarLayoutEditor.tsx` | Remove route label |

---

## Result

- Feature Flags accessible at `/dashboard/platform/feature-flags`
- Visible in Platform Admin sidebar for owners and admins
- Uses platform-consistent dark theme styling
- Removed from staff/organization dashboard entirely
- Per-organization flag overrides remain available in Account Detail tabs (already implemented as `AccountFeatureFlagsTab`)
