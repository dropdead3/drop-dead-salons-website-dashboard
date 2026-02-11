

# Add Rubber Band Scroll Effect to Sidebar Navigation

## What This Does
Adds an iOS-style elastic "rubber band" bounce effect when you scroll past the top or bottom of the sidebar navigation. This gives the sidebar a premium, native-app feel instead of abruptly stopping at scroll boundaries.

## Technical Approach

### File: `src/components/dashboard/SidebarNavContent.tsx`

The sidebar `<nav>` element (line 358) currently uses plain `overflow-y-auto`. We will:

1. Add a custom CSS class `rubber-band-scroll` to the nav element
2. Define that class in the global stylesheet with `-webkit-overflow-scrolling: touch` and a JavaScript-driven elastic effect for non-iOS browsers

### File: `src/hooks/useRubberBandScroll.ts` (new)

A small custom hook that:
- Attaches `touchstart`, `touchmove`, `touchend` (and `wheel`) listeners to the nav ref
- Detects when the user scrolls past the top or bottom boundary
- Applies a CSS `transform: translateY(...)` with easing to simulate the rubber band pull
- On release, animates back to `translateY(0)` with a spring-like transition
- Uses `requestAnimationFrame` for smooth 60fps animation
- Caps the maximum overscroll distance (e.g., 80px) with diminishing resistance

### File: `src/index.css`

Add a utility class for the overscroll container:
- `overscroll-behavior: none` to prevent the browser's default overscroll on the nav
- A CSS transition for the snap-back animation: `transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)`

### How It Works

```text
User scrolls past boundary
        |
        v
Hook detects overscroll distance
        |
        v
Applies translateY with resistance curve (sqrt-based diminishing return)
        |
        v
User releases / stops scrolling
        |
        v
Spring transition snaps content back to translateY(0)
```

### Changes Summary

| File | Change |
|---|---|
| `src/hooks/useRubberBandScroll.ts` | New hook -- elastic overscroll logic with touch + wheel support |
| `src/components/dashboard/SidebarNavContent.tsx` | Apply the hook to the nav ref element |
| `src/index.css` | Add `overscroll-behavior: none` and snap-back transition utility |

