

# Instant Tooltip Hover Hints for Sidebar Icons

## Problem
The sidebar footer icons (Clock In, Lock Dashboard, Feedback/Bug/Help) show tooltips with the default 700ms delay, while the new HoverPopover flyout menus appear instantly. This creates an inconsistent hover experience.

## Solution
Set `delayDuration={0}` on the root `TooltipProvider` in `App.tsx` (line 205). This makes all tooltips across the app appear instantly on hover, matching the HoverPopover behavior.

Components that already override `delayDuration` locally (e.g., `toggle-pill.tsx` at 300ms, `AnimatedBlurredAmount.tsx` at 100ms) will continue using their own values since local providers take precedence.

## File Changed

### `src/App.tsx` (line 205)
Change:
```tsx
<TooltipProvider>
```
To:
```tsx
<TooltipProvider delayDuration={0}>
```

## Impact
- All sidebar tooltips (Lock, Clock In, Feedback, Bug, Help) will appear instantly
- Consistent with HoverPopover flyout timing
- Components with their own `delayDuration` overrides are unaffected
- Single-line change, zero risk

