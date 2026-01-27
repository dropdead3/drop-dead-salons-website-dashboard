
# Move Sidebar Navigation Configurator to Role Access

## Overview

This plan moves the full-featured **Sidebar Navigation Configurator** (currently shown under System Settings for Super Admins) to the new **Role Access** settings section, and updates the relevant memory contexts to reflect this architectural change.

## Current State

| Component | Location | Capability |
|-----------|----------|------------|
| `SidebarLayoutEditor` | Settings → System (super_admin only) | Full drag-and-drop reordering, visibility toggles, role-based overrides, live preview |
| `NavigationAccessPanel` | Settings → Role Access → Navigation tab | Simplified visibility-only toggles (no reordering, no live preview) |

The screenshot shows the **SidebarLayoutEditor** with:
- Role selector tabs (Global, Super Admin, DOO, Manager, etc.)
- Section drag-and-drop reordering
- Per-section visibility toggles with link counts
- Live sidebar preview panel

## Proposed Changes

### 1. Update RoleAccessConfigurator to Use SidebarLayoutEditor

**File**: `src/components/dashboard/settings/RoleAccessConfigurator.tsx`

Replace the simplified `NavigationAccessPanel` in the Navigation tab with the full `SidebarLayoutEditor`:

```typescript
import { SidebarLayoutEditor } from './SidebarLayoutEditor';

// In the TabsContent for navigation:
<TabsContent value="navigation" className="mt-0">
  <SidebarLayoutEditor />
</TabsContent>
```

This moves the full sidebar configuration UI (with reordering, live preview, and role tabs) into the Role Access hub.

### 2. Remove SidebarLayoutEditor from System Settings

**File**: `src/pages/dashboard/admin/Settings.tsx`

Remove the conditional rendering of `SidebarLayoutEditor` under the `system` category:

```typescript
// Remove this block (lines ~1128-1131):
{/* Sidebar Layout - Super Admin Only */}
{roles.includes('super_admin') && (
  <SidebarLayoutEditor />
)}
```

This eliminates the duplicate placement and ensures the sidebar configurator lives exclusively in Role Access.

### 3. Remove Redundant NavigationAccessPanel

**File**: `src/components/dashboard/settings/NavigationAccessPanel.tsx`

Since the full `SidebarLayoutEditor` already handles per-role navigation visibility with a superior interface (including reordering and live preview), the simplified `NavigationAccessPanel` becomes redundant and can be deleted.

### 4. Update Imports in RoleAccessConfigurator

**File**: `src/components/dashboard/settings/RoleAccessConfigurator.tsx`

- Remove: `import { NavigationAccessPanel } from './NavigationAccessPanel';`
- Add: `import { SidebarLayoutEditor } from './SidebarLayoutEditor';`

### 5. Adjust Tab Structure (Optional Simplification)

Since `SidebarLayoutEditor` already has its own internal role selector tabs, we have two options:

**Option A (Recommended)**: Remove the role selector from `RoleAccessConfigurator` header when viewing the Navigation panel, since `SidebarLayoutEditor` has its own. The Role Access role selector would still apply to Page Tabs and Widgets panels.

**Option B**: Modify `SidebarLayoutEditor` to accept a `selectedRole` prop to sync with the parent role selector. This requires more refactoring.

For simplicity, **Option A** is recommended for this phase.

---

## File Summary

| File | Action |
|------|--------|
| `src/components/dashboard/settings/RoleAccessConfigurator.tsx` | Modify - Import and render `SidebarLayoutEditor` instead of `NavigationAccessPanel` |
| `src/pages/dashboard/admin/Settings.tsx` | Modify - Remove `SidebarLayoutEditor` from system settings |
| `src/components/dashboard/settings/NavigationAccessPanel.tsx` | Delete - No longer needed |

---

## Memory Context Updates

The following memory entries will be updated to reflect the new architecture:

### Update: `memory/auth/role-access-configurator-navigation-panel`

**New Content**:
> The 'Role Access Configurator' integrates the full 'SidebarLayoutEditor' for managing sidebar navigation. This editor supports drag-and-drop section and link reordering, per-role visibility overrides, custom section creation, and a live preview panel. Role selection is handled within the editor's own tabs (Global, Super Admin, DOO, etc.). This replaces the previous simplified visibility-only panel.

### Update: `memory/auth/role-based-access-configurator-system`

**New Content**:
> The 'Role Access Configurator' (accessible at /dashboard/admin/settings?tab=role-access) is a unified hub for managing role-based visibility. It contains three panels: 1) Navigation Panel - the full SidebarLayoutEditor with drag-and-drop reordering and live preview; 2) Page Tabs Panel - manages internal page triggers; 3) Widgets Panel - manages dashboard widget visibility. The SidebarLayoutEditor was moved from System Settings to consolidate all role-based access controls in one location.

---

## Benefits

1. **Single Location**: All role-based access configuration in one place
2. **Full Functionality**: Users get the complete sidebar editor (reordering, preview) rather than a simplified version
3. **No Duplication**: Removes the duplicate sidebar editor from System Settings
4. **Cleaner Architecture**: Role Access becomes the definitive hub for visibility and navigation control
5. **Consistent UX**: The same comprehensive interface is now accessible via the Role Access card

---

## Access Control

The Role Access settings category should remain accessible to users with appropriate permissions (super_admin, admin roles with `manage_visibility_console` permission) to ensure proper access control is maintained.
