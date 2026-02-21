

# Hover-to-Open Collapsed Sidebar Flyouts

## Current Behavior
When the sidebar is collapsed, clicking an icon opens a popover flyout showing the section's links. This requires an extra click before navigating.

## Proposed Change
Replace click-triggered popovers with hover-triggered popovers. The flyout appears on mouse enter and dismisses on mouse leave (with a small delay to prevent flicker when moving between trigger and menu).

## Approach

### 1. Create a `HoverPopover` wrapper component

A new `src/components/dashboard/HoverPopover.tsx` component that wraps Radix Popover with controlled `open` state driven by `onMouseEnter` / `onMouseLeave` on both the trigger and the content.

Key behaviors:
- Opens on hover (no click required)
- 150ms close delay so users can move cursor from icon to flyout without it disappearing
- Closes immediately on link click (via existing `onNavClick`)
- Falls back to click behavior on touch devices (hover isn't reliable on mobile, though collapsed sidebar is desktop-only)

### 2. Update `SidebarNavContent.tsx` (lines 657-708)

Replace `<Popover>` with `<HoverPopover>` for all collapsed section flyouts. Remove `PopoverTrigger` click wrapper -- the trigger becomes pure hover target.

### 3. Update `CollapsibleNavGroup.tsx` (lines 167-218)

Same replacement for the manager sub-group collapsed flyouts.

### 4. Keep `SidebarPopoverContent` unchanged

The visual bridge design (glass aesthetic, triangular connector notch, leftward shadow) stays exactly as-is. Only the open/close trigger mechanism changes.

## Technical Detail

```text
HoverPopover (controlled Popover)
  |-- open state managed by useRef timer + useState
  |-- onMouseEnter on wrapper div -> clearTimeout, setOpen(true)
  |-- onMouseLeave on wrapper div -> setTimeout(150ms, setOpen(false))
  |-- Popover open={open} onOpenChange={setOpen}
  |-- Children: PopoverTrigger (icon) + SidebarPopoverContent (menu)
```

The wrapper div encompasses both the trigger icon and the portal content area. Since `SidebarPopoverContent` renders in a Portal, we attach `onMouseEnter`/`onMouseLeave` to the portal content as well, keeping the popover open while the cursor is over either element.

## Files Changed
- **New**: `src/components/dashboard/HoverPopover.tsx`
- **Edit**: `src/components/dashboard/SidebarNavContent.tsx` -- swap Popover for HoverPopover
- **Edit**: `src/components/dashboard/CollapsibleNavGroup.tsx` -- swap Popover for HoverPopover

