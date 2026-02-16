
# Move Non-Schedule FAB Back to Original Position

## What Changed Previously
When we moved the FAB up (`bottom-20`) to avoid covering the bottom nav on the Schedule page, that same positioning was applied to all pages. The non-schedule pages should use the original `bottom-6 right-6` position (equal padding on bottom and side).

## Change

### File: `src/components/dashboard/HelpFAB.tsx`
- **Line 55**: Change `bottom-20 right-6` to `bottom-6 right-6` on the non-schedule popover trigger

The schedule-page FAB (line 33) stays at `bottom-20 right-6` to clear the bottom nav.

### Summary
| Page | Position |
|------|----------|
| Schedule | `bottom-20 right-6` (above bottom nav) |
| All other dashboard pages | `bottom-6 right-6` (equal padding, original) |
