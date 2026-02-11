

# Fix: "Booked Today" Should Mean Appointments Created Today

## Problem

The "New Bookings" card says "Booked Today" but actually shows appointments *occurring* today, not appointments *created* (booked) today. At 3:27 AM, zero new bookings have been made today, yet the card shows 20 — because 20 appointments are *scheduled* for today (all booked days ago).

Database confirms: all 20 appointments for today were created between Feb 4-10. None were created on Feb 11.

## Fix

Change `useNewBookings.ts` to filter by `created_at` (when the booking was made) instead of `appointment_date` (when the appointment occurs).

## Technical Details

| File | Change |
|---|---|
| `src/hooks/useNewBookings.ts` | Replace `appointment_date` filtering with `created_at` filtering throughout the hook. Since `created_at` is a timestamp (not a date), we need to use timestamp bounds for date ranges (e.g., `gte('created_at', '2026-02-11T00:00:00')` and `lte('created_at', '2026-02-11T23:59:59')`). The `getDateBounds` function will return ISO timestamp strings instead of date strings. The new/returning client logic (checking for prior appointments) should still use `appointment_date` since that determines if a client has visited before. |

### Specific changes in `useNewBookings.ts`:

1. **`getDateBounds()`** (lines 12-49): Return start-of-day and end-of-day timestamps instead of date strings. Use local timezone bounds to avoid the UTC shift issue (e.g., `new Date(year, month, day, 0, 0, 0).toISOString()`).

2. **Main range query** (lines 113-120): Change `.gte('appointment_date', startDate).lte('appointment_date', endDate)` to `.gte('created_at', startDate).lte('created_at', endDate)`. This makes "Booked Today" show appointments that were *created* today.

3. **30-day comparison queries** (lines 157-174): Same change — use `created_at` instead of `appointment_date` for the 30-day and previous 30-day counts, so the trend comparison is also based on booking creation date.

4. **Prior appointment check** (lines 133-138): Keep using `appointment_date` here — this determines if a client is "new" (no prior visits), which is correctly based on when appointments occur, not when they were booked.

5. **Future appointment check for rebook rate** (lines 193-198): Keep using `appointment_date` here — rebook rate checks if a client has a future scheduled appointment, which should be based on when it occurs.

This aligns the "Booked Today" metric with its natural meaning: how many appointments were booked (created) today.
