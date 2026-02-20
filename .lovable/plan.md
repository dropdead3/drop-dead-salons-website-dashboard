
# Auto-Scroll Calendar to Operating Hours

## What This Does
When the day or week calendar view loads, it will automatically scroll to just above the location's opening time so you immediately see the first available booking slots -- no manual scrolling needed.

## How It Works
- When the calendar renders (or when the date/location changes), it checks the selected location's opening hour for that day
- It then scrolls the grid container to a position roughly 1 hour before the opening time
- This gives you a small buffer of context above the first bookable slot
- If no operating hours are defined, it falls back to scrolling to the user's configured `hours_start` preference

## Technical Details

### DayView Changes (`src/components/dashboard/schedule/DayView.tsx`)
- Add a `useRef` on the scrollable container (`div.flex-1.overflow-auto`)
- Add a `useEffect` that calculates the scroll position based on `locationHours.open` (or `hoursStart` fallback)
- Scroll target: 1 hour before the open time, converted to pixel offset using the existing `ROW_HEIGHT` (16px per 15-min slot = 64px per hour)
- Uses `scrollTo({ top, behavior: 'instant' })` so it doesn't feel sluggish on load

### WeekView Changes (`src/components/dashboard/schedule/WeekView.tsx`)
- Add a `useRef` on the scrollable container (`div.flex-1.overflow-auto`)
- Add a `useEffect` that finds the earliest opening hour across the visible week days using `getLocationHoursForDate`
- Scroll target: 1 hour before the earliest open time
- Uses `ROW_HEIGHT` (20px per 15-min slot = 80px per hour)

### No Changes Needed in Schedule.tsx
- The location hours data is already passed as props to both views, so no parent-level changes are required
