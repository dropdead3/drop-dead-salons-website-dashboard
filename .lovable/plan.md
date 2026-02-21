

## Seamless Sidebar Popout Menu Design

### What We're Fixing

The collapsed sidebar popover menus (the flyout panels that appear when clicking icons like the gear/Settings icon) currently float next to the sidebar with a small gap. The goal is to:

1. Add more visual spacing between the sidebar icon and the popover
2. Create a seamless visual connection so the popover feels anchored to the clicked icon rather than floating independently

### Design Approach

Create a "bridge" effect using a CSS pseudo-element or wrapper that visually connects the popover to its trigger icon. This involves:

- Increasing `sideOffset` from 8 to 12-16px for breathing room
- Adding a subtle connecting shape (a small triangular notch/arrow or a blurred bridge element) on the left edge of the popover, aligned with the trigger icon
- Matching the popover's background and border styling to create the "seamlessly connected" illusion
- Adding a soft glow or shadow that extends toward the trigger

### Technical Changes

**1. Custom PopoverContent variant for sidebar flyouts**

Create a reusable `SidebarPopoverContent` wrapper that adds:
- A left-pointing notch/arrow via `::before` pseudo-element
- Increased `sideOffset` (16px)
- Matching glassmorphic styling (`bg-card/90 backdrop-blur-xl border-border/50`)
- A subtle connecting shadow that bridges toward the sidebar

**2. Update both popover locations**

| File | Change |
|------|--------|
| `src/components/dashboard/CollapsibleNavGroup.tsx` (line 186) | Replace `PopoverContent` with new `SidebarPopoverContent` |
| `src/components/dashboard/SidebarNavContent.tsx` (line 676) | Replace `PopoverContent` with new `SidebarPopoverContent` |

**3. The visual connector**

A small arrow/notch on the left side of the popover panel, positioned at the vertical center of the trigger icon. This is achieved with a CSS `::before` element using border-triangle or clip-path technique, colored to match the popover background. Combined with a subtle box-shadow that bleeds leftward, this creates the illusion of a single connected surface.

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/dashboard/SidebarPopoverContent.tsx` | **New** -- custom popover content with arrow connector and glassmorphic styling |
| `src/components/dashboard/CollapsibleNavGroup.tsx` | Swap `PopoverContent` for `SidebarPopoverContent` |
| `src/components/dashboard/SidebarNavContent.tsx` | Swap `PopoverContent` for `SidebarPopoverContent` |

