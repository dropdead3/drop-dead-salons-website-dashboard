
## Fix: Feedback Buttons Not Stacking When Sidebar is Collapsed

### Problem

The `SidebarFeedbackButtons` component always renders its two icon buttons in a horizontal `flex` row. When the sidebar collapses to its narrow state, there isn't enough width for both icons side-by-side, causing the layout to break (the Bug icon overflows outside the container as shown in the screenshot).

The other footer buttons (`SidebarClockButton`, `SidebarLockButton`) already accept an `isCollapsed` prop and adapt their layout accordingly -- this component does not.

### Fix

**File: `src/components/dashboard/SidebarFeedbackButtons.tsx`**

- Accept an `isCollapsed` prop (matching the pattern used by sibling components)
- When collapsed: switch from `flex gap-1` (horizontal) to `flex flex-col gap-1` (vertical stack)
- Remove the component's own border/background wrapper styling since the parent container in `SidebarNavContent` already provides that styling -- this eliminates the double-border/nested-card issue visible in the screenshot

**File: `src/components/dashboard/SidebarNavContent.tsx`**

- Pass `isCollapsed={isCollapsed}` to `SidebarFeedbackButtons` (line 634), matching how it's passed to `SidebarClockButton` and `SidebarLockButton`

### Technical Details

| File | Change |
|------|--------|
| `src/components/dashboard/SidebarFeedbackButtons.tsx` | Add `isCollapsed` prop; switch flex direction to `flex-col` when collapsed; remove redundant border/bg wrapper |
| `src/components/dashboard/SidebarNavContent.tsx` | Pass `isCollapsed` prop on line 634 |

Two files, minimal changes.
