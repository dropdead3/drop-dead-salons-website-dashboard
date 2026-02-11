
# Make Schedule/Tasks Grid Responsive When Cards Are Hidden

## The Problem
When "Today's Schedule" is hidden (for non-stylist roles), the "My Tasks" card only spans half the grid width, leaving an empty gap on the right side.

## The Fix

### File: `src/pages/dashboard/DashboardHome.tsx`

Change the grid container (line 481) from a static `lg:grid-cols-2` to a dynamic column count based on whether `hasStylistRole` is true:

**Before:**
```tsx
<div className="grid gap-6 lg:grid-cols-2">
```

**After:**
```tsx
<div className={cn("grid gap-6", hasStylistRole && "lg:grid-cols-2")}>
```

When `hasStylistRole` is false, the grid stays single-column and "My Tasks" spans the full width. When true, both cards sit side by side as before.

| File | Change |
|---|---|
| `src/pages/dashboard/DashboardHome.tsx` | Make grid cols conditional on `hasStylistRole` |
