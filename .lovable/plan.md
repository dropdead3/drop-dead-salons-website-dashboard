

# Rename "Access & Controls Hub" to "Roles & Controls Hub"

## Changes

Update all references to "Access & Controls Hub" across the codebase to "Roles & Controls Hub".

### File: `src/pages/dashboard/admin/AccessHub.tsx`
- Line 63: Change the `<h1>` text from `"Access & Controls Hub"` to `"Roles & Controls Hub"`

### File: `src/components/dashboard/HubQuickLinks.tsx`
- Line 68: Change the `label` from `'Access Hub'` to `'Roles Hub'` (keeping the short form consistent)

### File: Sidebar navigation (if label exists there)
- Update any sidebar link text that says "Access Hub" or "Access & Controls Hub" to match the new name.

All other internal references (route paths, component names, file names) remain unchanged to avoid unnecessary refactoring.

