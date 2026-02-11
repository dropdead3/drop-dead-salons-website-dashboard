
# Beautify Quick Actions Dropdown -- Consistent Menu Items

## The Problem
The "View As" and "Phorest Sync" items inside the Quick Actions dropdown are rendering as their standalone button/popover components (with borders, rounded pill shapes, different sizing). They visually clash with the standard `DropdownMenuItem` rows like "Hide Numbers" and "Help Center."

## The Fix

### File: `src/components/dashboard/DashboardLayout.tsx` (lines 1066-1106)

Rewrite the dropdown content so every row follows the same visual pattern: **icon (w-4 h-4) + label text + optional right-side accessory**, all using `DropdownMenuItem` or `DropdownMenuLabel` consistently.

### Changes

1. **View As**: Instead of embedding the full `ViewAsToggle` component (which renders its own `Button` + nested `DropdownMenu`), render a `DropdownMenuItem` that, when clicked, opens a separate dialog/sheet or navigates. Since the ViewAs logic is complex (nested dropdown with search, roles, users), the cleanest approach is to make it render as a **menu-item-styled trigger** -- essentially restyling the `ViewAsToggle` button to look like a native dropdown item when rendered inside this overflow menu.

   Approach: Add a `variant` prop or `asMenuItem` prop to `ViewAsToggle` so when used inside the overflow dropdown, its trigger button renders with `DropdownMenuItem`-matching styles (`w-full justify-start text-sm px-2 py-1.5 rounded-sm hover:bg-accent`) instead of its default outlined pill button.

2. **Phorest Sync**: Same approach -- render the `PhorestSyncPopout` trigger as a menu-item-styled row. Add an `asMenuItem` prop so the trigger button matches the dropdown item look: `RefreshCw` icon + "Sync Status" label + health dot on the right.

3. **Consistent icon sizing**: Ensure all icons are `w-4 h-4` and left-aligned with `gap-2`.

4. **Remove wrapper divs**: Remove the `<div className="px-1 py-0.5">` wrappers that add inconsistent padding.

### Detailed Code Plan

**ViewAsToggle** (inner component, ~line 492-523):
- Accept an optional `asMenuItem?: boolean` prop
- When `asMenuItem` is true, render the trigger button with these classes: `variant="ghost" className="w-full justify-start gap-2 h-auto px-2 py-1.5 rounded-sm font-normal text-sm"` and hide the chevron/badge decorations, showing just: `EyeOff icon + "View As" text` (or the active state text)

**PhorestSyncPopout** (separate file):
- Accept an optional `asMenuItem?: boolean` prop
- When `asMenuItem` is true, render the trigger button as: `variant="ghost" className="w-full justify-start gap-2 h-auto px-2 py-1.5 rounded-sm font-normal text-sm"` showing: `RefreshCw icon + "Sync Status" text + health dot`

**DashboardLayout dropdown** (lines 1084-1096):
- Remove the wrapper `<div>` elements
- Pass `asMenuItem` to both components
- This makes every item in the dropdown visually identical in height, padding, icon size, and hover state

### Result
Every row in the dropdown will have:
- Identical left padding and icon alignment
- Same font size (text-sm) and weight (normal)
- Same hover background (bg-accent)
- Same height (~36px)
- Clean separators between logical groups

| File | Change |
|---|---|
| `src/components/dashboard/DashboardLayout.tsx` | Add `asMenuItem` prop to ViewAsToggle, remove wrapper divs, pass prop in dropdown |
| `src/components/dashboard/PhorestSyncPopout.tsx` | Add `asMenuItem` prop to restyle trigger button as menu-item row |
