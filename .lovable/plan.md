

# Add After-Service Rebook Rate to New Bookings Card

## What This Adds

A new metric row showing returning clients who rebooked at checkout today, displayed as both a count and a percentage rate. This leverages the existing `rebooked_at_checkout` boolean already on the `phorest_appointments` table.

**Formula**: Rebook Rate = (Returning clients with `rebooked_at_checkout = true` whose `appointment_date = today`) / (Total returning clients with `appointment_date = today`) x 100

Note: This looks at appointments **scheduled for today** (service date), not appointments **created today** (booking date). The existing "Booked Today" metric tracks creation date; the rebook rate tracks service date — because rebooking happens after the service.

---

## Changes

### 1. Update `useNewBookings.ts`

- Add a new query for today's **service appointments** (by `appointment_date = today`, not `created_at`), filtering to returning clients only (`is_new_client = false`)
- Select `rebooked_at_checkout` flag
- Calculate:
  - `returningServicedToday`: count of returning clients with service today
  - `rebookedAtCheckoutToday`: count where `rebooked_at_checkout = true`
  - `rebookRate`: percentage (0-100), or `null` if no returning services today

### 2. Update `NewBookingsCard.tsx`

- Add a new section below the New/Returning grid (or replace the Returning Clients cell with a richer layout)
- Display:
  - Rebook count: "X of Y rebooked" 
  - Rebook rate percentage with a progress-style indicator
  - CalendarCheck icon (green tones for high rates, amber for mid, red for low)
- Include `MetricInfoTooltip` explaining the metric

### Visual Layout

The rebook rate appears as a third row below the New/Returning grid:

```text
+------------------------------------------+
|  [CalendarCheck]  After-Service Rebook    |
|  7 of 9 returning clients rebooked       |
|  ████████████░░░  78%                     |
+------------------------------------------+
```

---

## Technical Details

### New query in `useNewBookings.ts`

```text
SELECT id, is_new_client, rebooked_at_checkout, location_id
FROM phorest_appointments
WHERE appointment_date = today
  AND status != 'cancelled'
  AND is_new_client = false
```

### New return fields

- `returningServicedToday: number`
- `rebookedAtCheckoutToday: number`  
- `rebookRate: number | null`

### No database changes needed

The `rebooked_at_checkout` column already exists on `phorest_appointments`.
