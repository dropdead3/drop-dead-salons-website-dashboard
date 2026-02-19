

## Unify Top Bar Button Styles

### Goal
Make the three controls in the top bar -- "Show/hide $", the role badge (e.g. "Super Admin"), and "View As" -- visually cohesive: all fully rounded (`rounded-full`), same height, and consistent padding. The role badge keeps its special gradient colors but becomes a pill-shaped button matching the others' dimensions.

### Changes

**File: `src/components/dashboard/DashboardLayout.tsx`**

**1. HideNumbersToggle (lines 839-851)**
- Change from `size="sm"` / `h-8` to explicit `rounded-full h-9 px-4` for a full pill shape
- Keep `variant="ghost"` and muted styling

**2. Access Badge (lines 1151-1154)**
- Replace the `<Badge>` with a styled `<div>` (or keep Badge but override classes) to match button dimensions
- Apply `rounded-full h-9 px-4 inline-flex items-center gap-1.5 text-xs font-medium border` plus the existing `getAccessBadgeColor()` gradient classes
- Remove `rounded-lg` (currently set), replace with `rounded-full`
- Ensure same `h-9` height as the adjacent buttons

**3. ViewAsToggle button (lines 569-596)**
- Add `rounded-full h-9 px-4` to the non-menuItem variant
- Keep existing `variant="outline"` / active amber styling
- Remove `size="sm"` (height controlled explicitly)

### Technical Details
- All three controls: `h-9 rounded-full px-4 text-xs`
- Badge keeps its gradient background, amber/yellow border, and shine animation -- just resized to match button height and given full rounding
- No structural or behavioral changes, purely visual alignment

