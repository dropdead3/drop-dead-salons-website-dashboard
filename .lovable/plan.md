
# Increase Bottom Spacing Between Calendar and Action Bar

## Change
Increase the bottom padding on the calendar container from `pb-20` (80px) to `pb-28` (112px) to create more breathing room between the calendar content and the floating action bar, matching the visual spacing at the top of the calendar.

## Technical Details

### File: `src/pages/dashboard/Schedule.tsx` (line 471)

Change `pb-20` to `pb-28`:

```tsx
// Current
<div className={cn("flex-1 p-4 overflow-hidden", (view === 'day' || view === 'week') && "pb-20")}>

// New
<div className={cn("flex-1 p-4 overflow-hidden", (view === 'day' || view === 'week') && "pb-28")}>
```

This gives 112px of bottom padding, which after subtracting the action bar height (~48px) and its own bottom margin (16px), leaves approximately 48px of visible gap between the last calendar row and the top of the action bar -- visually balanced with the top spacing.
