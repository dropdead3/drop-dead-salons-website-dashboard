

# Fix Sticky Preview and Enlarge Preview Screen

## Root Cause: Why Sticky Doesn't Work

The `DashboardLayout.tsx` content wrapper (line 838) has `overflow-x-hidden`, which creates a new scroll container and **breaks `position: sticky`** on all descendants. This is a well-known CSS limitation -- sticky positioning only works when no ancestor between the sticky element and the scroll root has `overflow: hidden`, `auto`, or `scroll`.

## Changes

### 1. Fix the overflow ancestor in DashboardLayout

**File: `src/components/dashboard/DashboardLayout.tsx` (line 838)**

Replace `overflow-x-hidden` with `overflow-x-clip`. The `clip` value prevents horizontal overflow visually (same effect) but does **not** create a scroll container, so sticky positioning works normally.

```
Before: "w-full transition-[padding-left] duration-200 ease-in-out min-w-0 overflow-x-hidden"
After:  "w-full transition-[padding-left] duration-200 ease-in-out min-w-0 overflow-x-clip"
```

This is a safe, backward-compatible change. `overflow-x: clip` is supported in all modern browsers (Chrome 90+, Firefox 81+, Safari 16+).

### 2. Make the preview screen much bigger

**File: `src/components/dashboard/settings/KioskPreviewPanel.tsx` (lines 604-606)**

Increase the `max-w` constraints on the tablet frame so the preview fills more of the available space:

```
Before:
  settings.display_orientation === 'landscape' ? "max-w-[400px]" : "max-w-[320px]"

After:
  settings.display_orientation === 'landscape' ? "max-w-[560px]" : "max-w-[420px]"
```

This makes the preview tablet ~30% larger, taking advantage of the wider right column from the previous layout change.

### Summary

Two small, targeted edits:
1. One class swap in DashboardLayout (`overflow-x-hidden` to `overflow-x-clip`) -- fixes sticky
2. Two max-width values bumped in KioskPreviewPanel -- makes the preview screen bigger

