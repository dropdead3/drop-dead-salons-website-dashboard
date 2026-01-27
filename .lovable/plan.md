
# Role-Based Navigation & Access Configurator

## Overview

This plan creates a unified, role-centric system for managing navigation links, page tabs, and dashboard widget visibility. Admins will select a role first, then configure everything that role can see - creating a complete, customized experience for each of the 8 roles.

## Current Architecture Summary

After reviewing the codebase, here's what exists:

| System | Storage | What It Controls |
|--------|---------|------------------|
| Sidebar Layout Editor | `business_settings.sidebar_layout` (JSON) | Section order, link visibility per role |
| Visibility Console | `dashboard_element_visibility` table | Dashboard widgets/charts per role |
| Permission System | `user_permissions` table | Feature-level access (view_leaderboard, etc.) |

**Key Finding**: The SidebarLayoutEditor already supports role-specific overrides via `roleVisibility` in the JSON config. The Visibility Console uses a database table for widgets. These systems aren't unified.

## Proposed Solution

### 1. Unified Role Access Hub

Create a single "Role Access" settings tab that consolidates three panels:

```text
+----------------------------------------------------------+
|  ROLE ACCESS CONFIGURATOR                                 |
+----------------------------------------------------------+
|  [Super Admin] [DOO] [Manager] [Ops Asst] [Receptionist]  |
|  [Stylist] [Stylist Asst] [Admin Asst]                    |
+----------------------------------------------------------+
|  ← STYLIST ACCESS                    [Copy From] [Reset]  |
+----------------------------------------------------------+
|  [Navigation] [Page Tabs] [Widgets]                       |
+----------------------------------------------------------+
|                                                           |
|  Panel content based on selected sub-tab                  |
|                                                           |
+----------------------------------------------------------+
```

### 2. Three Configuration Panels

**Panel 1: Navigation Access**
- Simplified version of SidebarLayoutEditor focused on visibility only (no drag-and-drop)
- Checkboxes for each section and link
- Shows current visibility state for selected role

**Panel 2: Page Tabs Access**
- New panel for controlling page-level tabs
- Groups tabs by page (Stats, Analytics Hub, Settings, etc.)
- Uses the existing `dashboard_element_visibility` table with new element keys
- Element key convention: `{pageKey}_{tabId}_tab` (e.g., `stats_leaderboard_tab`)

**Panel 3: Widgets Access**
- Simplified version of Visibility Console
- Shows dashboard elements filtered to selected role
- Toggle switches for visibility

### 3. Page Tab Registration

Update pages to register their tabs with the visibility system:

**Stats.tsx** - Team Leaderboard tab
```typescript
<VisibilityGate 
  elementKey="stats_leaderboard_tab"
  elementName="Team Leaderboard Tab"
  elementCategory="Page Tabs"
>
  <TabsTrigger value="leaderboard">Team Leaderboard</TabsTrigger>
</VisibilityGate>
```

**AnalyticsHub.tsx** - Category tabs (Sales, Operations, Marketing, Reports)

**Settings.tsx** - Admin-only tabs

---

## Files to Create

### 1. `src/components/dashboard/settings/RoleAccessConfigurator.tsx`

Main component with role selector and sub-tab navigation:

```typescript
// Structure
- Role selector (tabs with icons/colors from useRoles())
- Sub-tabs: Navigation | Page Tabs | Widgets
- Panel content based on selected sub-tab
- Actions: Copy From Role, Reset to Default
```

### 2. `src/components/dashboard/settings/NavigationAccessPanel.tsx`

Simplified navigation visibility editor:

```typescript
// Shows:
- All sections from DEFAULT_SECTION_ORDER
- Links grouped by section
- Checkboxes for show/hide
- Reads/writes to roleVisibility in sidebar_layout
```

### 3. `src/components/dashboard/settings/PageTabsAccessPanel.tsx`

New panel for page tab visibility:

```typescript
// Shows:
- Tabs grouped by page
- Auto-discovered from dashboard_element_visibility where category = 'Page Tabs'
- Toggle switches for each tab
```

### 4. `src/components/dashboard/settings/WidgetsAccessPanel.tsx`

Simplified widget visibility panel:

```typescript
// Shows:
- Widgets grouped by category (excluding 'Page Tabs')
- Toggle switches for visibility
- Bulk actions: Show All, Hide All
```

---

## Files to Modify

### 1. `src/pages/dashboard/admin/Settings.tsx`

Add "Role Access" to the settings categories:

```typescript
// Add to SECTION_CONFIG or equivalent:
{
  id: 'role-access',
  label: 'Role Access',
  description: 'Configure navigation and visibility by role',
  icon: Shield,
}
```

### 2. `src/pages/dashboard/Stats.tsx`

Wrap the Team Leaderboard tab with VisibilityGate:

```typescript
// Before
{canViewLeaderboard && (
  <TabsTrigger value="leaderboard">Team Leaderboard</TabsTrigger>
)}

// After
{canViewLeaderboard && (
  <VisibilityGate 
    elementKey="stats_leaderboard_tab"
    elementName="Team Leaderboard"
    elementCategory="Page Tabs"
  >
    <TabsTrigger value="leaderboard">
      <Trophy className="w-4 h-4 mr-2" />
      Team Leaderboard
    </TabsTrigger>
  </VisibilityGate>
)}
```

### 3. `src/pages/dashboard/admin/AnalyticsHub.tsx`

Wrap analytics category tabs with VisibilityGate for role-based control.

### 4. `src/hooks/useDashboardVisibility.ts`

Add helper hooks:

```typescript
// Get tab visibility for a specific role
export function useTabVisibilityByRole(role: string) {
  const { data: visibilityData } = useDashboardVisibility();
  
  return useMemo(() => {
    if (!visibilityData) return {};
    
    return visibilityData
      .filter(v => v.role === role && v.element_category === 'Page Tabs')
      .reduce((acc, v) => {
        acc[v.element_key] = v.is_visible;
        return acc;
      }, {} as Record<string, boolean>);
  }, [visibilityData, role]);
}
```

### 5. `src/components/visibility/VisibilityGate.tsx`

Update to properly handle TabsTrigger children:

```typescript
// When used on tabs, return null to completely hide the tab
// rather than rendering an empty element
if (!isVisible) {
  return null;  // Ensures tab disappears completely
}
```

---

## Technical Details

### Role Selector

Uses roles from database with dynamic icons and colors:

```typescript
const { data: roles = [] } = useRoles();

// Render role tabs
{roles.map((role) => {
  const Icon = getIconByName(role.icon);
  return (
    <button
      key={role.id}
      onClick={() => setSelectedRole(role.name)}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg",
        selectedRole === role.name && "ring-2",
      )}
      style={{ 
        borderColor: role.color,
        backgroundColor: selectedRole === role.name ? `${role.color}20` : undefined 
      }}
    >
      <Icon className="w-4 h-4" style={{ color: role.color }} />
      {role.display_name}
    </button>
  );
})}
```

### Tab Visibility Resolution

When a user has multiple roles, tabs are visible if **any** role grants access (union logic). This matches the existing visibility console behavior.

### Auto-Registration

Tabs wrapped in VisibilityGate auto-register on first render:
1. Check if element exists in database
2. If not, create entries for all active roles (default visible)
3. Admins can then hide specific tabs per role in the configurator

---

## Page Tabs to Register

| Page | Tab Key | Display Name |
|------|---------|--------------|
| My Stats | `stats_leaderboard_tab` | Team Leaderboard |
| Analytics Hub | `analytics_sales_tab` | Sales |
| Analytics Hub | `analytics_operations_tab` | Operations |
| Analytics Hub | `analytics_marketing_tab` | Marketing |
| Analytics Hub | `analytics_reports_tab` | Reports |
| Settings | `settings_role_access_tab` | Role Access |

---

## File Summary

| File | Action |
|------|--------|
| `src/components/dashboard/settings/RoleAccessConfigurator.tsx` | Create |
| `src/components/dashboard/settings/NavigationAccessPanel.tsx` | Create |
| `src/components/dashboard/settings/PageTabsAccessPanel.tsx` | Create |
| `src/components/dashboard/settings/WidgetsAccessPanel.tsx` | Create |
| `src/pages/dashboard/admin/Settings.tsx` | Modify - Add Role Access tab |
| `src/pages/dashboard/Stats.tsx` | Modify - Wrap leaderboard tab |
| `src/pages/dashboard/admin/AnalyticsHub.tsx` | Modify - Wrap category tabs |
| `src/hooks/useDashboardVisibility.ts` | Modify - Add helper hooks |
| `src/components/visibility/VisibilityGate.tsx` | Modify - Handle tab children |

---

## Benefits

1. **Role-Centric**: Select a role first, then see everything that role can access
2. **Unified Hub**: Navigation, tabs, and widgets in one place
3. **8 Roles Supported**: Super Admin, DOO, Admin Assistant, Manager, Operations Assistant, Receptionist, Stylist, Stylist Assistant
4. **Auto-Discovery**: New tabs auto-register via VisibilityGate
5. **Existing Infrastructure**: Leverages current database tables and hooks
6. **No Breaking Changes**: Backward compatible with existing configurations
