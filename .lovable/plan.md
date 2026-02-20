
# Fix: Top Menu Bar Not Auto-Hiding After Auto-Scroll Change

## Problem
After adding the auto-scroll feature to DayView and WeekView, the top menu bar on the Schedule page is no longer auto-hiding. The bar should be hidden by default and only appear when the user hovers near the top of the screen.

## Root Cause
The `scrollTo` call in the `useEffect` fires during initial render/mount, which can cause a brief layout shift or scroll event propagation that interferes with the header's hide/show state in `DashboardLayout`. The programmatic scroll may trigger the window's scroll listener or cause a transient hover-zone interaction during the initial paint.

## Fix

### DayView.tsx and WeekView.tsx
Wrap the `scrollTo` call in a `requestAnimationFrame` to defer it until after the browser has completed layout and paint. This prevents the programmatic scroll from interfering with the header's initial hidden state.

**Before:**
```ts
scrollRef.current.scrollTo({ top, behavior: 'instant' });
```

**After:**
```ts
const ref = scrollRef.current;
requestAnimationFrame(() => {
  ref?.scrollTo({ top, behavior: 'instant' });
});
```

This is a minimal, targeted change -- just two lines in each file -- that ensures the auto-scroll happens cleanly after the header has settled into its hidden state.
