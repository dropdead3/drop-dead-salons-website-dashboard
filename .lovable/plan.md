

# Add Notes Field to the Booking Wizard

## Overview

Add an optional notes/special instructions textarea to the confirmation step of the Quick Booking Popover. These notes will be saved on the appointment record so stylists can see them during service and at checkout.

## What Changes

A collapsible "Add Notes" section will appear on the confirmation/summary step, right below the Stylist section and above the footer. This keeps the wizard clean (notes are optional) while making them easy to add when needed. The notes will be passed through to the booking API and stored on the appointment.

## Why This Approach

- **Confirmation step is the right place**: The user has already selected everything and is reviewing -- this is the natural moment to add special instructions, pricing notes, or promo codes.
- **Collapsible keeps it clean**: Most bookings won't need notes, so it starts collapsed with a subtle "+ Add notes" trigger to avoid clutter.
- **No new step needed**: Adding a whole new wizard step for an optional field would slow down the booking flow unnecessarily.
- **Existing infrastructure**: The `appointments` table already has a `notes` column and the `create_booking` database function already accepts `p_notes`, so no database changes are needed.

## Technical Details

**File: `src/components/dashboard/schedule/QuickBookingPopover.tsx`**

1. Add a `bookingNotes` state variable (empty string default) alongside existing state.
2. Reset `bookingNotes` in `handleClose()`.
3. In the confirmation step (step === 'confirm'), add a collapsible notes section after the Stylist block:
   - A ghost-style button labeled "+ Add special notes" that reveals a Textarea when clicked.
   - Placeholder text: "Special instructions, pricing notes, promo codes..."
   - Styled consistently with the existing confirmation cards (bg-card, border, rounded-lg).
4. Pass `bookingNotes` into the `create-phorest-booking` edge function body as a `notes` field.
5. Update the `create-phorest-booking` edge function (if it doesn't already forward notes) to pass notes through to the appointment record.

No database migration is needed -- the `notes` column already exists on the appointments table.

