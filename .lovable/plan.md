

## Smoother Sidebar Collapse/Expand Animations

### Problem
The sidebar collapse and expand animation feels abrupt, especially the corner radius transformation between `rounded-xl` (expanded) and `rounded-full` (collapsed). The current `duration-200` (200ms) is too fast for the shape change to feel natural.

### Changes

**File: `src/components/dashboard/DashboardLayout.tsx`** (line 866)

Update the sidebar `<aside>` transition to be smoother:

1. Increase duration from `duration-200` to `duration-500` (500ms) for a more relaxed, polished feel
2. Change easing from `ease-in-out` to a custom cubic-bezier curve (`[cubic-bezier(0.4,0,0.2,1)]`) for a more natural deceleration on the border-radius morph
3. Ensure `border-radius` is explicitly in the `transition-[...]` property list (it already is via `border-radius`, but we confirm it)

The updated transition class becomes:
```
transition-[width,background-color,border-color,border-radius]
duration-500
ease-[cubic-bezier(0.4,0,0.2,1)]
```

**File: `src/components/dashboard/SidebarNavContent.tsx`** (internal elements)

Update internal element transitions to match the sidebar's timing so everything morphs in sync:
- NavLink `transition-all duration-200` becomes `transition-all duration-300` (lines ~277, ~411, ~430, ~655, ~687)
- This keeps internal items slightly faster than the container for a layered, organic feel

### Summary
- Sidebar container: 200ms to 500ms with smoother easing for the shape transformation
- Internal nav items: 200ms to 300ms to stay in sync without feeling sluggish
- Result: a calm, confident collapse/expand animation where corners morph smoothly

### Files Modified
- `src/components/dashboard/DashboardLayout.tsx`
- `src/components/dashboard/SidebarNavContent.tsx`
