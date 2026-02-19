

## Fix Equal-Height Card Pairing

### Root Cause

The `PinnableCard` component's outer `div` has `relative h-full` but is **not** a flex container. Its child (the `contentRef` div) has `flex-1`, which only works when the parent is a flex container. Since it isn't, `flex-1` is ignored and the content div just takes its natural height -- which is why the Goal Tracker card stops short while New Bookings fills its own content height.

```text
Current DOM chain (broken):

div.flex-1.min-w-0.flex.flex-col     <-- DashboardHome pair wrapper (flex parent, good)
  div.relative.h-full                <-- PinnableCard outer (NOT flex, breaks chain)
    div.flex-1.flex.flex-col          <-- contentRef (flex-1 ignored, parent not flex)
      Card                            <-- doesn't stretch
```

### Fix

Add `flex flex-col` to the PinnableCard outer div so `flex-1` on the content div actually takes effect.

```text
Fixed DOM chain:

div.flex-1.min-w-0.flex.flex-col     <-- DashboardHome pair wrapper
  div.relative.h-full.flex.flex-col  <-- PinnableCard outer (now a flex column)
    div.flex-1.flex.flex-col          <-- contentRef (flex-1 works, stretches)
      Card                            <-- flex-1 via [&>*]:flex-1, fills height
```

### Technical Change

**File: `src/components/dashboard/PinnableCard.tsx`** (line 74)

Change the outer div className from:
```tsx
className={cn("relative h-full", className)}
```
to:
```tsx
className={cn("relative h-full flex flex-col", className)}
```

One line, one class addition. This completes the flex chain so both cards in a pair stretch to the height of the taller one.

