

# Convert Client Detail Panel to Right-Side Floating Pop-Out

## Problem

The client detail panel is currently centered on screen. It should instead float on the right side of the viewport, matching a slide-out panel pattern while keeping the premium bento styling (rounded corners, backdrop blur, shadow).

## Changes

### File: `src/components/dashboard/ClientDetailSheet.tsx`

**Line 386-392** -- Update the floating panel's position and animation:

- Remove center positioning (`left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`)
- Apply right-side positioning: `fixed right-4 top-[50%] -translate-y-1/2 z-50`
- Keep existing styling: `rounded-xl border border-border bg-popover shadow-xl overflow-hidden flex flex-col`
- Keep responsive width: `w-[calc(100vw-2rem)] max-w-[440px] max-h-[85vh]`

**Animation update** (same lines):

- Change from center scale animation to a right-side slide-in:
  - `initial`: `{ opacity: 0, x: 40 }` (starts slightly off-screen right)
  - `animate`: `{ opacity: 1, x: 0 }`
  - `exit`: `{ opacity: 0, x: 40 }`
- Remove `scale` from the animation since slide feels more natural for a side panel

## Result

The panel will slide in from the right edge with a 16px (1rem) margin, vertically centered, keeping the premium backdrop blur overlay and all existing bento card content unchanged.

