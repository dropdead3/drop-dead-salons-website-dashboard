

# Fix Timezone Bug + Make Rebook Rate Accurate

## Problem Summary

Two data accuracy issues:

1. **Timezone mismatch**: "Booked Today" uses UTC dates, showing bookings from the previous evening (Arizona time) as "today." At 2:17 AM local, you see 9 bookings that were actually synced during Monday evening.

2. **Rebook rate always 0%**: The `rebooked_at_checkout` field is never populated by the Phorest sync. All 321 appointments in the database have `false`. The field only gets set via a manual in-app action that nobody uses yet.

---

## Fix 1: Timezone-Aware Date Handling

**File: `src/hooks/useNewBookings.ts`**

Replace the UTC-based date calculations with local-timezone-aware boundaries. Instead of using `format(startOfDay(today), "yyyy-MM-dd'T'HH:mm:ss")` (which produces a naive datetime string treated as UTC by Supabase), convert local midnight to a proper UTC ISO string.

```text
Before: "2026-02-11T00:00:00" (ambiguous, treated as UTC)
After:  "2026-02-11T07:00:00.000Z" (explicit UTC, = midnight MST)
```

This uses JavaScript's `Date` object which is timezone-aware:
- `new Date()` with `setHours(0,0,0,0)` gives local midnight
- `.toISOString()` converts it to the correct UTC equivalent

This fix applies to all date boundaries in the hook: today start/end, 7-day, 30-day, and 60-day ranges.

---

## Fix 2: Derive Rebook Status from Actual Data

Since the Phorest API does not provide a "rebooked at checkout" flag, derive this information by checking whether each returning client serviced today has a **future appointment** already booked.

**Logic**: For each returning client with an appointment today, check if they have any appointment with `appointment_date > today`. If yes, consider them "rebooked."

**File: `src/hooks/useNewBookings.ts`**

After fetching today's returning-client appointments, gather their `phorest_client_id` values and run a second query:

```text
SELECT DISTINCT phorest_client_id
FROM phorest_appointments
WHERE phorest_client_id IN (list of today's returning client IDs)
  AND appointment_date > today
  AND status != 'cancelled'
```

Then `rebookedAtCheckoutToday` = count of today's returning clients whose `phorest_client_id` appears in that future-appointment set.

This approach:
- Requires no manual staff action
- Reflects real booking behavior from Phorest
- Automatically updates as the sync runs throughout the day

---

## Technical Details

### Changes to `useNewBookings.ts`

1. Replace all `format(startOfDay(...), "yyyy-MM-dd'T'HH:mm:ss")` calls with timezone-aware UTC conversions using `toISOString()` on locally-constructed Date objects.

2. Update the rebook query to also select `phorest_client_id`.

3. Add a follow-up query for future appointments matching those client IDs.

4. Replace the `rebooked_at_checkout` filter with the derived "has future appointment" logic.

### No changes to `NewBookingsCard.tsx`

The UI already renders the rebook rate correctly. Only the data source changes.

### No database changes

All data already exists in `phorest_appointments`.

