

# Fix Input Focus Ring Clipping in New Client Dialog

## Problem
The form's scrollable container has minimal padding (`pr-1`), causing the 2px focus ring and 2px ring offset on inputs to be visually clipped by the `overflow-y-auto` container.

## Solution

**File:** `src/components/dashboard/schedule/NewClientDialog.tsx` (line 203)

Update the form element's className from:
```
space-y-4 overflow-y-auto flex-1 min-h-0 pr-1
```
to:
```
space-y-4 overflow-y-auto flex-1 min-h-0 px-1 py-1
```

This adds 4px padding on all sides of the scrollable area, giving the focus ring enough room to render without clipping. The `px-1` ensures left-side rings are also protected, and `py-1` prevents top/bottom clipping on the first and last fields.

## Why This Works
- The Input component uses `focus-visible:ring-2 focus-visible:ring-offset-2`, which extends ~6px outside the input border
- `overflow-y-auto` clips anything outside its bounds
- Adding `px-1 py-1` (4px) provides breathing room so the ring renders cleanly within the scroll container

One small, targeted change -- no other files affected.
