

## Move Collapse Toggle Into Sidebar Header

### What Changes
The sidebar collapse/expand icon button will move from the top menu bar into the sidebar itself, positioned to the right of the organization logo (like the Retropay reference screenshot). The organization logo will also be made smaller.

### Changes

**1. `src/components/dashboard/SidebarNavContent.tsx` -- Add collapse toggle next to logo**

The component needs a new prop for `onToggleCollapse` (or direct access to the toggle function). In the logo header area (lines 319-353):

- **Expanded state**: Change the logo container from `justify-between` (already set) to show the logo on the left and a collapse icon button on the right. Reduce logo height from `h-5` to `h-4` (smaller). Reduce padding from `p-6` to `p-4` for a tighter header.
- **Collapsed state**: The icon button becomes the expand trigger. Show a small expand icon (ChevronRight) below or instead of the logo icon, or make the collapsed logo itself toggle expansion. Reduce the collapsed icon from `w-8 h-8` to `w-6 h-6`.

New imports needed: `PanelLeftClose`, `ChevronRight` from lucide-react (ChevronRight may already be available).

The toggle button will be a ghost icon button with the `PanelLeftClose` icon (expanded) or `ChevronRight` icon (collapsed), matching the current top bar styling.

A new prop `onToggleCollapse` will be added to `SidebarNavContentProps` and passed from `DashboardLayout.tsx`.

**2. `src/components/dashboard/DashboardLayout.tsx` -- Remove collapse toggle from top bar, pass prop to sidebar**

- Remove the sidebar toggle button block from the top bar (lines 1124-1142, the `Tooltip` wrapping the collapse button)
- Pass `onToggleCollapse={toggleSidebarCollapsed}` and `isCollapsed` (already passed) to `SidebarNavContent`
- Keep `NavHistoryArrows` as the first item in the top bar left side

### Visual Result
- Sidebar header: `[Logo]  ............  [collapse icon]` (expanded)
- Sidebar header: `[small icon]` with tooltip (collapsed) -- clicking expands
- Top bar left side: starts with nav history arrows instead of collapse toggle
- Logo is slightly smaller for a cleaner, more refined look matching the reference screenshots
