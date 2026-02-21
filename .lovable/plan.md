

## Add Closure Indicators to Day Selector Buttons

### What Changes
When a location is closed on a particular day (due to regular hours or holiday closures), the quick day selector buttons in the schedule header will show a visual indicator, making it immediately clear which upcoming days are closed without having to click into each one.

### Visual Design
- **Closed day buttons**: A small red dot appears below the date number on any day the selected location is closed
- **Tooltip on hover**: Shows "Closed" or "Closed -- [reason]" (e.g., "Closed -- Christmas Day") when hovering over a closed day button
- **Muted styling**: Closed day text gets slightly reduced opacity to subtly de-emphasize unavailable days

### Technical Details

**File: `src/components/dashboard/schedule/ScheduleHeader.tsx`**

1. Import `isClosedOnDate` and location types from `useLocations`, plus `ClosedBadge` and `Tooltip` components
2. Expand the `locations` prop type to include `hours_json` and `holiday_closures` fields (or import full location data inside the component via `useLocations`)
3. Inside the quick day button loop, call `isClosedOnDate(selectedLocationObj.hours_json, selectedLocationObj.holiday_closures, day)` for each day
4. If closed, add:
   - A small red dot indicator (`w-1 h-1 rounded-full bg-destructive`) beneath the date
   - Reduced opacity on the button text
   - Wrap the button in a Tooltip showing "Closed" or the closure reason
5. Apply the same check to the "Today" button

**File: `src/pages/dashboard/Schedule.tsx`** (if needed)

- Ensure the `locations` array passed to `ScheduleHeader` includes `hours_json` and `holiday_closures` -- check current query and expand if these fields are missing from the prop type

**No new files or dependencies required.**
