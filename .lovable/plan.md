
# Fix Client Detail Panel Positioning

## Problem

The panel is incorrectly positioned in the center-right of the screen using `top-[50%] -translate-y-1/2`, which causes it to float awkwardly in the middle of the viewport (as seen in the screenshot). It needs to be anchored to the right edge, spanning vertically with proper top/bottom margins.

## Fix

### File: `src/components/dashboard/ClientDetailSheet.tsx` (Line 392)

Replace the current positioning classes:

```
Before:  fixed right-4 top-[50%] -translate-y-1/2 ... max-h-[85vh]
After:   fixed right-4 top-4 bottom-4 ... max-h-none
```

Specific changes:
- Remove `top-[50%] -translate-y-1/2` (the cause of the misalignment)
- Add `top-4 bottom-4` so the panel stretches from near the top to near the bottom with 16px margin on each side
- Remove `max-h-[85vh]` since `top-4 bottom-4` naturally constrains the height
- Keep everything else: `right-4`, `rounded-xl`, `bg-card/80 backdrop-blur-xl shadow-2xl`, spring animation, and internal ScrollArea

## Result

The panel will be pinned to the right edge of the viewport, spanning the full height with even 16px margins on all sides -- matching the expected right-side floating drawer pattern.
