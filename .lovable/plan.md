

# Edge Case Hardening for Zura Sticky Guidance Navigation

## Problem Statement
The sticky guidance panel needs to handle a chain of navigations gracefully. Right now, the "happy path" works (click link in guidance -> panel stays on destination page). But several edge cases can break the experience or cause confusion.

## Edge Cases Identified and Solutions

### 1. User clicks a second internal link from the sticky panel on a destination page
**Current behavior**: Already handled -- `handleInternalLink` in `ZuraStickyGuidance.tsx` re-saves the same state and navigates. The panel persists.
**Status**: Working. No change needed.

### 2. User presses browser Back button from a destination page
**Current behavior**: The browser navigates back, but `savedState` stays in memory. If they go back to a non-dashboard page, the panel still shows. If they go back to `/dashboard`, the panel hides (the `isVisible` check excludes `/dashboard`), but `savedState` still lingers in memory with no way to restore it visually.
**Fix**: Add a `useEffect` in `ZuraStickyGuidance` that listens to `location.pathname` changes. When the user returns to `/dashboard`, auto-dismiss the saved state so it doesn't leak. The AIInsightsCard/Drawer restoration logic (already implemented) will handle reopening the guidance panel on the dashboard if appropriate.

### 3. User navigates via sidebar to a completely unrelated page (not from a Zura link)
**Current behavior**: The sticky panel stays visible because `savedState` is still set and the path is not `/dashboard`.
**Desired behavior**: This is actually fine -- the panel should persist so the user can still reference it. No change needed. The dismiss (X) button handles cleanup.

### 4. User clicks "Return to Zura" (ArrowLeft) from the sticky panel, then immediately clicks another insight
**Current behavior**: `navigate('/dashboard')` fires, panel hides. The `restore()` function in AIInsightsCard picks up the state. If the user then clicks a different insight, the old restored state gets replaced.
**Status**: Working correctly. No change needed.

### 5. User opens a link from guidance, then navigates to another internal link from the *page content* itself (not the sticky panel)
**Current behavior**: The sticky panel stays visible with the original guidance. The page changes underneath.
**Desired behavior**: This is correct -- the panel should keep showing the original guidance. No change needed.

### 6. Rapid double-click on an internal link in the sticky panel
**Current behavior**: Could fire `saveAndNavigate` twice, causing a double navigation.
**Fix**: Add a simple debounce guard (a ref flag that blocks re-entry for 300ms) to `handleInternalLink` in `ZuraStickyGuidance`.

### 7. The 5-minute auto-dismiss timer resets on every link click within the sticky panel
**Current behavior**: `saveAndNavigate` clears the old timer and sets a new one, so yes, it resets. This is the desired behavior -- active usage keeps the panel alive.
**Status**: Working correctly.

### 8. User has the panel expanded, clicks a link within it, navigates to a new page -- panel should stay expanded
**Current behavior**: `expanded` state is local to the component. Since `ZuraStickyGuidance` doesn't unmount during navigation (it's in the layout), the `expanded` state persists across navigations within the dashboard.
**Status**: Working correctly because the component is mounted in `DashboardLayout`.

## Summary of Changes

Only two small fixes are needed:

### File: `src/components/dashboard/ZuraStickyGuidance.tsx`
1. **Auto-dismiss on dashboard return**: Add a `useEffect` that calls `ctx.dismiss()` when `location.pathname === '/dashboard'` and `savedState` exists. This prevents stale state after browser Back navigation.
2. **Debounce internal link clicks**: Add a ref-based guard to `handleInternalLink` to prevent rapid double-clicks from triggering duplicate navigations.

### Technical Detail

```text
// Pseudo-code for the two fixes:

// Fix 1: Auto-dismiss when returning to dashboard
useEffect(() => {
  if (location.pathname === '/dashboard' && ctx?.savedState) {
    ctx.dismiss();
  }
}, [location.pathname]);

// Fix 2: Debounce guard
const navigatingRef = useRef(false);
const handleInternalLink = (href) => (e) => {
  e.preventDefault();
  if (navigatingRef.current) return;
  navigatingRef.current = true;
  setTimeout(() => { navigatingRef.current = false; }, 300);
  ctx.saveAndNavigate(href, ctx.savedState);
};
```

No new files, no new dependencies, no backend changes.
