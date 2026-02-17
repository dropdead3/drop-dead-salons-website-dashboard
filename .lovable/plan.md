

## Improve Tab Toggle Visibility in Light Mode

### Problem

The active tab state uses `bg-white/[0.08]` and `ring-white/[0.12]` -- white at 8% and 12% opacity. On the light cream background, this is nearly invisible. The selected tab ("Tomorrow" in your screenshot) looks almost identical to unselected tabs.

### Solution

Replace the single-mode white overlay with a dual-mode approach:
- **Light mode**: Use `bg-black/[0.07]` background + `ring-black/[0.10]` ring -- a subtle dark tint that creates clear contrast on cream
- **Dark mode**: Keep `dark:bg-white/[0.08]` + `dark:ring-white/[0.12]` -- the existing glass look that works well on dark backgrounds

This same fix applies to all three tab variants (standard, filter, responsive) and their hover states.

### Technical Details

**Files Modified**

1. **`src/components/ui/tabs.tokens.ts`** -- Single source of truth for all tab classes
   - `trigger` active state: replace `bg-white/[0.08]` with `bg-black/[0.07] dark:bg-white/[0.08]`, and `ring-white/[0.12]` with `ring-black/[0.10] dark:ring-white/[0.12]`
   - `filterTrigger` active state: same dual-mode swap
   - `overflowTrigger` hover: `hover:bg-black/[0.05] dark:hover:bg-white/[0.08]`
   - `overflowMenuItem` hover: same pattern

2. **`src/components/ui/tabs.tsx`** -- The `TabsTrigger` component has inline classes that duplicate the tokens (not using `TABS_CLASSES.trigger`). Update its inline active-state classes to match the new dual-mode pattern.

3. **`src/components/ui/responsive-tabs-list.tsx`** -- The overflow dropdown button at line ~142 has an inline `hover:bg-white/[0.08]`. Update to the dual-mode pattern.

### Before/After

| State | Before (light mode) | After (light mode) |
|-------|---------------------|---------------------|
| Active bg | `bg-white/[0.08]` (invisible) | `bg-black/[0.07]` (subtle dark tint) |
| Active ring | `ring-white/[0.12]` (invisible) | `ring-black/[0.10]` (visible border) |
| Hover bg | `hover:bg-white/[0.08]` | `hover:bg-black/[0.05]` |

Dark mode remains unchanged with the existing white overlay values.
