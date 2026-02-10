

# Fix Text Distortion During Expand/Collapse Animation

## Problem

Both widgets use `framer-motion`'s `layoutId` to morph a button into a card. This causes the browser to interpolate the container's width/height, which **scales all child content** (including text) during the transition -- resulting in visible text distortion/warping.

## Solution

Replace the `layoutId` morph approach with a clean `AnimatePresence` transition that **never scales text**. Instead of morphing one shape into another, the button fades/scales out slightly while the card fades/scales in. The text remains at its native size throughout.

## Changes

### 1. `src/components/dashboard/AIInsightsDrawer.tsx`

- **Remove** `LayoutGroup` wrapper and `layoutId` from both states
- **Remove** `style={{ borderRadius }}` overrides (no longer needed without layout animation)
- **Keep** `AnimatePresence mode="wait"` for the swap
- **Collapsed button**: Add `initial`, `animate`, `exit` props:
  - `initial={{ opacity: 0, scale: 0.95 }}`
  - `animate={{ opacity: 1, scale: 1 }}`
  - `exit={{ opacity: 0, scale: 0.95 }}`
  - `transition={{ duration: 0.2, ease: "easeOut" }}`
- **Expanded card**: Add matching `initial`, `animate`, `exit` props:
  - `initial={{ opacity: 0, scale: 0.98, y: -4 }}`
  - `animate={{ opacity: 1, scale: 1, y: 0 }}`
  - `exit={{ opacity: 0, scale: 0.98, y: -4 }}`
  - `transition={{ duration: 0.25, ease: "easeOut" }}`
- Text, icons, and all child content remain completely static -- no distortion

### 2. `src/components/dashboard/AnnouncementsDrawer.tsx`

- Same changes as above: remove `LayoutGroup`, remove `layoutId`, remove `style={{ borderRadius }}`
- Add `initial`/`animate`/`exit` props to both collapsed and expanded states with the same values
- Text stays at native size throughout the entire animation

## What This Achieves

- **Zero text distortion**: No container morphing means no content scaling
- **Still smooth**: The subtle opacity + scale + y-offset transition feels polished
- **Simpler code**: No `LayoutGroup` needed, fewer animation concerns
- **Button text and card title remain at their exact rendered sizes** at all times

## Files Modified
- `src/components/dashboard/AIInsightsDrawer.tsx`
- `src/components/dashboard/AnnouncementsDrawer.tsx`

