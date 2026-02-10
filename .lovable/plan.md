

# Fix AI Insights Card Internal Scrolling -- For Real

## Problem
The scrollable `div` with `maxHeight: 480px` and `overflowY: auto` is not working because:
1. The `motion.div` inside `AnimatePresence` has no height constraint itself -- it renders at full content height, and the browser may not be clipping it properly due to how framer-motion handles layout
2. Even if the scroll appeared, there is no `onWheel` event trapping -- the page scroll would still steal wheel events

## Solution -- Two changes in `src/components/dashboard/AIInsightsCard.tsx`

### 1. Add an `onWheel` handler to trap scroll inside the card
Add an `onWheel` event handler on the scrollable div that calls `e.stopPropagation()` so when the mouse is inside the card, the dashboard page scroll is frozen and only the card content scrolls.

### 2. Move the height constraint INSIDE the motion.div, not outside it
The current structure is:
```
<div style={{ overflowY: 'auto', maxHeight: '480px' }}>   <-- scroll container
  <AnimatePresence>
    <motion.div>   <-- this has no constraint, renders full height
      ...content...
    </motion.div>
  </AnimatePresence>
</div>
```

The problem: `AnimatePresence` and `motion.div` can interfere with the parent's ability to measure overflow. The fix is to remove the scroll wrapper entirely and instead put the scroll directly on the `CardContent` using a `ref` and inline styles, plus ensure the Card's `max-h-[600px]` and `flex flex-col overflow-hidden` are kept.

### Concrete changes (line numbers from current file):

**Line 262** -- Keep `max-h-[600px] flex flex-col overflow-hidden` on Card (already there).

**Line 297** -- Change CardContent to be the scroll container itself:
```tsx
<CardContent 
  className={cn("pt-0 flex-1 min-h-0", activeGuidance && "p-0")} 
  style={{ overflowY: 'auto' }}
  onWheel={(e) => e.stopPropagation()}
>
```
- `flex-1 min-h-0` makes it shrink within the Card's max-height (the key missing piece that was removed in the last edit)
- `overflowY: 'auto'` directly on CardContent means it IS the scroll container
- `onWheel stopPropagation` prevents dashboard from scrolling when mouse is inside

**Line 298** -- Remove the wrapper `<div style={{ overflowY: 'auto', maxHeight: '480px' }}>` entirely. Just render `<AnimatePresence>` directly inside CardContent.

**Line 430** -- Remove the closing `</div>` for the removed wrapper.

### Why this will work
- `Card` has `max-h-[600px]` capping total height
- `CardContent` with `flex-1 min-h-0` fills remaining space but SHRINKS when content exceeds the cap -- this is the standard CSS trick for flex children that need to scroll
- `overflowY: auto` directly on `CardContent` (no intermediary wrappers) means the browser handles overflow natively
- `onWheel stopPropagation` traps scroll events inside the card so the dashboard doesn't scroll when the user scrolls within the insights card

### Why previous attempts failed
- Putting `overflowY` on a wrapper div between CardContent and AnimatePresence didn't work because `maxHeight: 100%` resolves to nothing (no explicit parent height), and `maxHeight: 480px` didn't clip because the motion.div animation layout interfered
- Removing `flex-1 min-h-0` from CardContent in the last edit broke the flex shrinking, so the card just grew to fit content again

