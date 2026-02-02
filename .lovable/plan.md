
# Remove Platform Admin Section from Organization Dashboard

## Problem

The "Platform Admin" navigation section is appearing in the regular organization dashboard sidebar when it should only be accessible via the dedicated Platform Admin Hub (which uses `PlatformLayout` and has its own sidebar at `/dashboard/platform/*`).

The issue occurs because the visibility check for the `platform` section is inside a conditional block that only runs when the Role Access Configurator has no overrides. When configurator overrides exist, the platform section can appear for users who shouldn't see it.

## Solution

The platform section visibility check should **always** run, regardless of configurator state. This section belongs exclusively to the Platform Admin Hub and should never appear in the organization dashboard.

---

## Technical Details

### File: `src/components/dashboard/SidebarNavContent.tsx`

**Current Logic (lines 466-481):**
```typescript
if (!hasConfiguratorOverrides) {
  if (sectionId === 'manager') { ... }
  if (sectionId === 'adminOnly') { ... }
  // Platform section only visible to platform users
  if (sectionId === 'platform') {
    shouldShow = isPlatformUser && filteredItems.length > 0;
  }
}
```

**Problem**: The platform check is inside the `!hasConfiguratorOverrides` block, so it gets skipped when the configurator has role overrides.

**Fix**: Move the platform section check **outside** the conditional block so it always runs, and change logic to always hide it (since this is the org dashboard, not the platform hub):

```typescript
if (!hasConfiguratorOverrides) {
  if (sectionId === 'manager') { ... }
  if (sectionId === 'adminOnly') { ... }
}

// Platform section should NEVER show in org dashboard - 
// it has its own dedicated layout at /dashboard/platform/*
if (sectionId === 'platform') {
  shouldShow = false;
}
```

---

## Summary

| Change | Description |
|--------|-------------|
| Move platform check | Move outside `hasConfiguratorOverrides` conditional |
| Simplify logic | Always set `shouldShow = false` for platform section in org dashboard |
| Result | Platform Admin section never appears in organization sidebar |

This ensures the Platform Admin section only appears in its dedicated layout (`PlatformSidebar`) and never leaks into the organization dashboard, regardless of role configuration or platform user status.
