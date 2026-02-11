

# Merge Two Top Bars into One Responsive Bar

## Problem
The current dashboard has two stacked horizontal bars for admin/platform users -- a "Platform Context Bar" (h-10) and a "Main Top Bar" (h-14). This feels cluttered and wastes vertical space. The user wants a single unified bar where less-used items collapse into an ellipsis/overflow dropdown on smaller screens.

## New Layout: Single Bar (h-14)

```text
+----------------------------------------------------------------------+
| [sidebar toggle] [OrgSwitcher] | [Search...] | [Hide$] [Badge] [ViewAs] [Sync] [?] [bell] [user] [...] |
+----------------------------------------------------------------------+
```

### Responsive Collapse

At narrower widths, secondary items collapse into an ellipsis (MoreHorizontal) dropdown menu:

**Always visible** (priority items):
- Sidebar toggle (left)
- Organization Switcher (left, platform users only)
- Search bar (center)
- Notifications bell (right)
- User avatar menu (right)

**Collapse into ellipsis dropdown** when space is tight:
- Show/Hide $ toggle
- Role badge (Super Admin, etc.)
- View As toggle
- Phorest Sync
- Help Center link

The ellipsis button only renders when there are items to show in it. On wide screens (xl+), all items display inline and the ellipsis disappears.

## Technical Details

### File: `src/components/dashboard/DashboardLayout.tsx`

1. **Remove Bar 1** (lines ~1002-1023) -- the separate Platform Context Bar div
2. **Merge its contents into Bar 2** (the main h-14 bar):
   - Move `OrganizationSwitcher` to the left section, after sidebar toggle
   - Move `HideNumbersToggle`, role badge, `ViewAsToggle`, `PhorestSyncPopout` to the right section
3. **Add responsive overflow**: Wrap secondary right-side items in a container that hides them at `< xl` breakpoint, and mirror them inside a new `DropdownMenu` triggered by a `MoreHorizontal` icon that only shows at `< xl`
4. The bar remains `h-14` with the same sticky/backdrop-blur styling

### Responsive Breakpoint Logic

```text
xl and above:  All items inline, no ellipsis button
Below xl:      Secondary items hidden, ellipsis dropdown appears
```

Using Tailwind classes:
- Secondary items wrapper: `hidden xl:flex items-center gap-3`
- Ellipsis dropdown trigger: `xl:hidden`

### Files Changed

| File | Change |
|---|---|
| `src/components/dashboard/DashboardLayout.tsx` | Remove Bar 1, merge items into Bar 2, add ellipsis overflow dropdown for responsive collapse |

Single file change -- restructures the top bar section of `DashboardLayout`.
