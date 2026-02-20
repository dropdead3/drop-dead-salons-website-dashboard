

# Remove Footer from Scheduling Page

## What We're Doing
Removing the "© 2026 Drop Dead · Powered by Drop Dead Salon Software" footer from the scheduling page. This footer is unnecessary on a full-screen calendar view and wastes vertical space.

## Approach
The Schedule page already wraps its content in `<DashboardLayout>`, which accepts a `hideFooter` prop. We simply need to pass `hideFooter` to suppress the footer on this page.

## Technical Change

**File: `src/pages/dashboard/Schedule.tsx`** (line 447)

Change:
```tsx
<DashboardLayout>
```
To:
```tsx
<DashboardLayout hideFooter>
```

This is a one-line change. The `DashboardLayout` component already supports `hideFooter` and conditionally hides the footer + adjusts layout to full-screen mode (using `h-screen overflow-hidden` instead of `min-h-screen`), which is already what the Schedule page needs.
