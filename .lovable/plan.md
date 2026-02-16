

# Closed-Day Warnings and Operating Hours Visibility on Calendar

## Overview
Add location operating hours awareness to all calendar views so that:
1. **Closed days** are visually distinct but still schedulable, with a confirmation warning
2. **Outside operating hours** time slots have a blocked-out/dimmed appearance
3. **Within operating hours** slots remain bright and clearly available

## What Changes

### 1. New Utility: `getLocationHoursForDate`
**File:** `src/hooks/useLocations.ts`

Add a helper function that, given a location's `hours_json`, `holiday_closures`, and a `Date`, returns:
- `isClosed: boolean` (already exists via `isClosedOnDate`)
- `closureReason?: string` (holiday name or "Regular hours")
- `openTime?: string` (e.g. "09:00")
- `closeTime?: string` (e.g. "18:00")

This consolidates the existing `isClosedOnDate` and `getTodayHours` into a date-aware function usable by calendar views.

### 2. Closed-Day Confirmation Dialog
**New file:** `src/components/dashboard/schedule/ClosedDayWarningDialog.tsx`

An `AlertDialog` that fires when a user tries to book on a closed day or outside operating hours:
- Title: "This location is closed"
- Body: "[Location Name] is closed on [date] (reason). Are you sure you want to schedule on this day?"
- Actions: "Cancel" / "Schedule Anyway"

### 3. DayView Updates
**File:** `src/components/dashboard/schedule/DayView.tsx`

- Accept new props: `locationHours?: { open: string; close: string } | null` and `isLocationClosed?: boolean`
- **Outside operating hours slots**: Apply a hatched/striped background pattern with reduced opacity (similar to the existing past-slot treatment but with a distinct diagonal-line pattern) to clearly differentiate from bookable hours
- **Closed day**: Show a subtle banner at the top ("Location closed -- [reason]") with the `ClosedBadge` component, and apply the outside-hours treatment to ALL time slots
- Slots remain clickable -- clicking triggers the warning dialog instead of blocking

### 4. WeekView Updates
**File:** `src/components/dashboard/schedule/WeekView.tsx`

- Accept `locations` data to check closure per day column
- For each day column, check `isClosedOnDate` against the selected location
- **Closed day columns**: Apply a muted overlay with a subtle "Closed" label in the header, and diagonal-stripe pattern across all slots
- **Outside operating hours rows**: Apply the same dimmed/striped pattern per-column based on that day's `open`/`close` times
- Day header shows the `ClosedBadge` when the location is closed that day

### 5. MonthView Updates
**File:** `src/components/dashboard/schedule/MonthView.tsx`

- Check `isClosedOnDate` for each day cell
- Closed days get a subtle muted background with a small "Closed" indicator (using `ClosedBadge`)
- Days remain clickable (clicking navigates to DayView which shows the full warning)

### 6. Schedule Page Integration
**File:** `src/pages/dashboard/Schedule.tsx`

- Pass the selected location's `hours_json` and `holiday_closures` down to DayView, WeekView, and MonthView
- Compute `isClosedOnDate` and operating hours for the current date/selected location
- Manage state for the closed-day warning dialog
- When a slot click occurs on a closed day or outside hours, show the `ClosedDayWarningDialog` before proceeding to the BookingWizard

### 7. BookingWizard Date Selection
**File:** `src/components/dashboard/schedule/booking/BookingWizard.tsx` (and `StylistStep.tsx`)

- When the user picks a date in the booking wizard's date picker, check if that date is closed for the selected location
- If closed, show the same warning dialog inline before allowing them to proceed

## Visual Treatment Summary

| Zone | Appearance |
|------|-----------|
| Operating hours | Normal bright background (current) |
| Outside operating hours | Diagonal stripe pattern, reduced opacity, slightly muted background |
| Closed day (all slots) | Full diagonal stripe pattern + "Closed" banner/badge in header |
| Past time slots | Solid muted background (existing, unchanged) |

## Technical Details

### Operating Hours Slot Marking (DayView/WeekView)
For each 15-minute slot, compare the slot time against the location's open/close times for that day of the week:
```
const dayHours = getLocationHoursForDate(location.hours_json, location.holiday_closures, date);
const isOutsideHours = !dayHours.isClosed && dayHours.openTime && dayHours.closeTime
  && (slotTime < dayHours.openTime || slotTime >= dayHours.closeTime);
```

### Stripe Pattern CSS
A repeating diagonal-line background using CSS gradients:
```
background: repeating-linear-gradient(
  -45deg,
  transparent,
  transparent 4px,
  hsl(var(--muted-foreground) / 0.08) 4px,
  hsl(var(--muted-foreground) / 0.08) 5px
);
```

### Warning Dialog Flow
```text
User clicks slot/date
  --> Is location closed OR outside hours?
    --> YES: Show ClosedDayWarningDialog
      --> "Schedule Anyway": proceed to BookingWizard
      --> "Cancel": do nothing
    --> NO: proceed to BookingWizard directly
```

