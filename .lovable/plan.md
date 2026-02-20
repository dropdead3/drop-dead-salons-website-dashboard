

# Recurring Appointments

## Overview
Add the ability for staff to create repeating appointments during the booking flow. The system generates future appointment instances from a recurrence rule, displays them on the calendar with a visual indicator, and allows managing/cancelling individual or all future occurrences.

## User Flow

1. Staff completes normal booking steps (client, service, stylist, time)
2. On the Confirm step, a "Repeat this appointment" toggle appears
3. When enabled, staff selects frequency and end condition
4. On confirm, the first appointment is created normally, then all future occurrences are generated and conflict-checked
5. Recurring appointments show a repeat icon on the calendar
6. Viewing a recurring appointment shows series info and options to cancel one or all future

## Frequency Options

| Frequency | Days Between |
|-----------|-------------|
| Weekly | 7 |
| Every 2 weeks | 14 |
| Every 4 weeks | 28 |
| Every 6 weeks | 42 |
| Every 8 weeks | 56 |
| Monthly | Calendar month (same day-of-month) |

## Technical Details

### 1. Database Migration

Add three columns to `phorest_appointments`:

- `recurrence_rule` (JSONB) -- stores the pattern on all occurrences (frequency, occurrences/end_date)
- `recurrence_group_id` (UUID) -- links all appointments in a series
- `recurrence_index` (INTEGER) -- position in series (0, 1, 2...)
- Partial index on `recurrence_group_id` for efficient series lookups

### 2. New Files

**`src/components/dashboard/schedule/booking/RecurrenceSelector.tsx`**
- Toggle switch: "Repeat this appointment"
- Frequency dropdown with all 6 options above
- End condition: number of occurrences (default 6, max 26) or end date
- Preview text showing count and final date (e.g., "Creates 6 appointments through Sep 25, 2026")

**`supabase/functions/create-recurring-appointments/index.ts`**
- Accepts: first appointment details, recurrence rule
- Generates future dates based on frequency
- Conflict-checks each date via existing `check_booking_conflicts` function
- Batch-inserts non-conflicting appointments with shared `recurrence_group_id`
- Returns: created count, skipped dates with reasons

### 3. Modified Files

**`BookingWizard.tsx`**
- Add `recurrenceRule` to wizard state
- Pass to ConfirmStep and use on final submit

**`ConfirmStep.tsx`**
- Render `RecurrenceSelector` component
- After creating first appointment, call `create-recurring-appointments` edge function if recurrence is set
- Show toast with results (e.g., "Created 5 of 6 recurring appointments. 1 skipped due to conflict.")

**`AppointmentDetailSheet.tsx`**
- Show "Recurring (3 of 6)" badge when appointment has `recurrence_group_id`
- Add "Cancel all future in series" button that cancels all appointments in the group with date >= current

**`usePhorestCalendar.ts`**
- Add `recurrence_group_id` and `recurrence_index` to the select query

**`AppointmentCard.tsx`** (or equivalent calendar card)
- Show small Repeat icon when `recurrence_group_id` is present

### 4. Edge Cases

- **Conflicts**: Skipped silently with a summary toast; the rest of the series is still created
- **Cancellation**: Cancelling a single occurrence does not affect others; "cancel all future" only affects same group with later dates
- **Monthly frequency**: Uses same day-of-month; if day doesn't exist (e.g., Jan 31 -> Feb), clamps to last day of month
- **Max occurrences**: Capped at 26 (roughly 6 months of weekly) to prevent runaway creation

