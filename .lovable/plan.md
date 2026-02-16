

# Fix Missing Closed-Day and Outside-Hours Warnings on Schedule Calendar

## Problem Identified
After thorough debugging, I found **two root causes** why the warnings never appear:

1. **WeekView bypasses `onSlotClick` entirely.** It uses `QuickBookingPopover` directly for slot clicks, so the closed-day/outside-hours check in `handleSlotClick` (Schedule.tsx) is never reached. The `onSlotClick` prop is defined in the interface but never called.

2. **Past time slots silently block clicks.** Both DayView and WeekView render past slots as `cursor-not-allowed` with no click handler and no warning message.

## Changes

### 1. WeekView: Intercept slot clicks before QuickBookingPopover
**File:** `src/components/dashboard/schedule/WeekView.tsx`

- For slots that are on a closed day or outside operating hours, call `onSlotClick(day, slotTime)` instead of opening the `QuickBookingPopover`. This routes them through `handleSlotClick` in Schedule.tsx where the warning dialog logic lives.
- For past slots, also call `onSlotClick` so the parent can decide how to handle them (show a toast or warning).
- Normal slots within operating hours continue using `QuickBookingPopover` as they do today.

The slot rendering logic (lines ~443-496) changes from:
```
past slot --> silent block (no click)
all other slots --> QuickBookingPopover
```
to:
```
past slot --> onSlotClick (parent handles warning)
closed/outside hours slot --> onSlotClick (parent handles warning)
normal slot --> QuickBookingPopover (unchanged)
```

### 2. DayView: Allow past slot clicks to trigger warning
**File:** `src/components/dashboard/schedule/DayView.tsx`

- In `DroppableSlot` (line 147-149), currently past slots are blocked. Change the click handler so past slots also call `onClick()`, allowing the parent to show a warning.

### 3. Schedule.tsx: Add past-time warning
**File:** `src/pages/dashboard/Schedule.tsx`

- In `handleSlotClick`, add a check for past times before the closed-day check:
  - If the selected slot is in the past, show a toast ("Cannot schedule in the past") and return early.
- The existing closed-day/outside-hours warning dialog logic remains unchanged.

### 4. Fix Tooltip ref warning in HelpFAB
**File:** `src/components/dashboard/HelpFAB.tsx`

- The console error about "Function components cannot be given refs" is caused by wrapping `motion.div` (which is a function component) with `TooltipTrigger` which tries to pass a ref. Wrap the `Tooltip` around the `Button` only (inside `motion.div`), not around the `motion.div` itself. This is a minor fix but cleans up the console.

## Summary of Warning Behaviors After Fix

| Scenario | Current Behavior | Fixed Behavior |
|----------|-----------------|----------------|
| Click closed-day slot (WeekView) | Opens QuickBookingPopover directly | Shows "Location is closed" warning dialog |
| Click outside-hours slot (WeekView) | Opens QuickBookingPopover directly | Shows "Outside operating hours" warning dialog |
| Click past slot (WeekView) | Silent block, no feedback | Toast: "Cannot schedule in the past" |
| Click closed-day slot (DayView) | Shows warning dialog | No change (already works) |
| Click outside-hours slot (DayView) | Shows warning dialog | No change (already works) |
| Click past slot (DayView) | Silent block, no feedback | Toast: "Cannot schedule in the past" |

