

# Default Preferred Location to Scheduler's Active Location

## Problem

When opening the New Client dialog, the "Preferred Location" field shows "Select preferred location" instead of pre-selecting the scheduler's currently toggled location. This happens because `NewBookingSheet` doesn't pass the scheduler's location to `NewClientDialog`.

## Changes

### 1. `src/components/dashboard/schedule/NewBookingSheet.tsx`

- Pass `defaultLocationId={selectedLocation}` to the `NewClientDialog` component (currently missing this prop)
- If `selectedLocation` is empty when the dialog opens, it will still show the placeholder (no regression)

### 2. `src/components/dashboard/schedule/NewClientDialog.tsx`

- Add a `useEffect` to sync `locationId` with `defaultLocationId` when the dialog opens -- ensuring that if the prop updates after initial mount (e.g. user changes scheduler location, then opens the dialog), the field reflects the current scheduler location
- This covers both `QuickBookingPopover` and `NewBookingSheet` flows

## Result

The "Preferred Location" field will automatically default to whichever location is currently selected in the scheduler, across all booking flows.

