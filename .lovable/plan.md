

## Fix Expand Animation - Over-Rounded Corners

### Problem
`rounded-full` equals `border-radius: 9999px`. When expanding from collapsed to expanded, the browser animates from 9999px down to 20px (`rounded-xl`). During the transition, intermediate values like 5000px or 3000px make the corners look absurdly bloated. The collapse direction works fine because going from 20px upward quickly clips to the element boundary.

### Solution
Replace `rounded-full` with `rounded-[32px]` on the collapsed sidebar. Since the collapsed sidebar is 64px wide, a 32px radius produces an identical pill shape visually -- but now the animation interpolates between 32px and 20px, which is a smooth, subtle morph.

### Changes

**File: `src/components/dashboard/DashboardLayout.tsx`** (line ~868)
- Change `lg:rounded-full` to `lg:rounded-[32px]` in the collapsed state

**File: `src/components/dashboard/SidebarNavContent.tsx`**
- Any internal elements using conditional `rounded-full` when collapsed should also switch to `rounded-[32px]` or remain as-is if they are small icon-sized elements (small square elements look fine with `rounded-full` since the actual pixel value is clamped)
- NavLink collapsed: keep `rounded-full` -- these are small icon buttons where 9999px clips fine
- Footer containers: keep `rounded-full` -- same reason

Only the main sidebar container needs the fix since it is the large element where the 9999px-to-20px interpolation is visible.

### Files Modified
- `src/components/dashboard/DashboardLayout.tsx` (1 line change)
