

# Unify Day View Booking to Match Week View Flow

## Problem
The Day view and Week view use two completely different booking components:
- **Week view**: Uses `QuickBookingPopover` -- a rich 5-step flow (service, location, client, stylist, confirm) with stylist-first mode, level-based pricing, banned client handling, service search, category browsing, client profile previews, and auto-stylist selection.
- **Day view**: Uses `BookingWizard` -- a simpler 4-step flow (service, client, stylist, confirm) missing many of the Week view's features.

Both are triggered from `Schedule.tsx`, but the Day view routes through `handleSlotClick` into `BookingWizard` while the Week view opens `QuickBookingPopover` inline on each slot.

## Solution
Replace the `BookingWizard` in `Schedule.tsx` with the `QuickBookingPopover`, rendered as the floating bento card panel (keeping the slide-from-right animation). This way both Day and Week views use the exact same booking flow and UI.

## Changes

### 1. `src/components/dashboard/schedule/QuickBookingPopover.tsx`
- Extract the inner booking content (header, steps, state) into a reusable component or add a `mode` prop that supports two rendering modes:
  - `"popover"` (current behavior for Week view inline popovers)
  - `"panel"` (floating bento card for Day view and the "New Booking" button)
- When `mode="panel"`, render as a fixed-position floating bento card with the same styling already established: `rounded-xl`, `bg-card/80`, `backdrop-blur-xl`, `border-border`, `shadow-2xl`, slide-in animation from right using Framer Motion.
- When `mode="popover"` (default), keep current centered modal behavior.

### 2. `src/pages/dashboard/Schedule.tsx`
- Remove the `BookingWizard` import and rendering.
- Add a new instance of `QuickBookingPopover` with `mode="panel"` for the `bookingOpen` state (triggered by Day view slot clicks and the "New Booking" button).
- Pass the existing `bookingDefaults` (date, time, stylistId) and `selectedLocation` to the panel-mode popover.

### 3. Cleanup (optional)
- The `BookingWizard` component and its sub-components (`BookingHeader`, `ClientStep`, `ServiceStep`, `StylistStep`, `ConfirmStep`) in `src/components/dashboard/schedule/booking/` can be deprecated since all booking now routes through `QuickBookingPopover`.

## Technical Details

The `QuickBookingPopover` already handles:
- 5-step flow: service --> location --> client --> stylist --> confirm
- Stylist-first mode ("Know your stylist? Select first")
- Level-based pricing via `useBookingLevelPricing`
- Service qualification filtering via `useStaffQualifiedServices`
- Banned client warnings
- Client profile previews
- Auto-stylist selection (self, preferred, highest level)
- Service search and category browsing with color-coded badges
- "Skip Services" option
- Booking notes
- Forward/back navigation with clickable progress segments

The panel mode will wrap the same inner content in:
```text
+--------------------------------------------------+
| AnimatePresence                                   |
|   motion.div (backdrop, bg-black/40)              |
|   motion.div (panel)                              |
|     fixed top-3 right-3 bottom-3                  |
|     w-full sm:max-w-md                            |
|     rounded-xl bg-card/80 backdrop-blur-xl        |
|     border-border shadow-2xl                      |
|     slide: x 100% --> 0 (spring)                  |
|                                                   |
|     [Same header, progress, steps as popover]     |
+--------------------------------------------------+
```

This ensures both views share identical booking logic, UI, and flow while the Day view retains its premium floating card presentation.

