
# Add "Add Service from Another Category" Button

## What Changes

In the service step footer of `QuickBookingPopover.tsx`, add a secondary button labeled "+ Add service from another category" between the service summary and the Continue button. Clicking it clears the `selectedCategory` state, returning the user to the category list while preserving all currently selected services.

## Technical Details

**File:** `src/components/dashboard/schedule/QuickBookingPopover.tsx`

In the service step footer (around line 903-930):
- Add a secondary/outline `Button` above the existing Continue button
- The button reads "+ Add service from another category"
- Only visible when a category is currently selected and at least one service has been chosen
- On click: `setSelectedCategory(null)` to return to the category list
- The selected services persist across category navigation, so the user can keep adding from different categories
