

# Add Bottom Padding to Calendar for Floating Action Bar

## What Changes
The calendar content area currently extends behind the floating action bar, causing it to obscure the bottom rows. We need to add bottom padding to the calendar's scrollable area so the content stops above the action bar, creating a clean bento-style gap.

## Approach
Add `pb-20` (80px) bottom padding to the calendar content area on day/week views. This ensures the last time slots remain visible and the floating bar sits cleanly below the calendar card with breathing room -- no overlap.

## Technical Details

### File: `src/pages/dashboard/Schedule.tsx` (line 471)

Change the calendar container's padding from `p-4` to `p-4 pb-20` (when day/week view is active). This gives the calendar scroll area enough bottom space so its content doesn't get hidden behind the ~64px floating action bar + its own 16px padding.

```tsx
// Current
<div className="flex-1 p-4 overflow-hidden">

// New -- add extra bottom padding when the action bar is visible
<div className={cn("flex-1 p-4 overflow-hidden", (view === 'day' || view === 'week') && "pb-20")}>
```

This is a single-line change. The `pb-20` (80px) accounts for the action bar height (~52px) plus the `pb-4` (16px) gap beneath it, leaving clean visual separation.

