

## Close Add-On Attachment Gaps

### Overview
Five gaps exist between the add-on configuration system and the booking/checkout experience. This plan addresses each one to create a complete, auditable add-on lifecycle.

---

### Gap 1: Link Add-On Events to Appointments

**Problem:** `booking_addon_events` has no `appointment_id` -- add-on revenue cannot be traced to specific visits.

**Fix:**
- Add `appointment_id` (nullable UUID) column to `booking_addon_events`
- After appointment creation succeeds in QuickBookingPopover, backfill the `appointment_id` on the event row
- This enables per-appointment add-on revenue reporting

---

### Gap 2: Resilient Add-On Attachment (Not Name-Matching)

**Problem:** The current `onAdd` handler matches add-ons to phorest services by exact name. If the name doesn't match, the add-on silently fails.

**Fix:**
- Add a `linked_service_id` column to `service_addons` (nullable) so admins can optionally map an add-on directly to a service
- In the `onAdd` handler, try `linked_service_id` first, then fall back to name-matching
- If neither resolves, show a warning toast: "Could not find matching service for [addon name]"
- This eliminates silent failures

---

### Gap 3: Add-On Awareness in Checkout

**Problem:** `CheckoutSummarySheet` shows no add-on breakdown, margin visibility, or upsell impact.

**Fix:**
- Query `booking_addon_events` for the current appointment at checkout time
- Display an "Add-Ons" section in the checkout summary showing each add-on with its price and margin badge
- Show a subtotal line for add-on revenue contribution
- This gives stylists and managers visibility into the upsell impact per transaction

---

### Gap 4: Track Declined Add-On Suggestions

**Problem:** Only acceptance is logged. Dismissals are not tracked, making true attachment rate calculation impossible.

**Fix:**
- Add a `status` column to `booking_addon_events` with values: `accepted`, `declined`, `dismissed`
- When the toast is dismissed, log one event per suggestion with `status = 'dismissed'`
- Update the stylist performance analytics to calculate: `attachment_rate = accepted / (accepted + dismissed)`
- The lever engine can then flag low attachment rates for coaching

---

### Gap 5: Add-On Duration Consistency

**Problem:** Add-on duration_minutes may differ from the matched phorest service duration, causing scheduling inaccuracies.

**Fix:**
- This is inherently handled when the add-on resolves to a real service (the service's duration is used for scheduling)
- Add a validation step in the add-on admin UI: when `linked_service_id` is set, show a warning if the add-on's `duration_minutes` differs from the linked service's duration
- This is advisory only -- no blocking logic -- but surfaces data inconsistencies early

---

### Database Changes

```text
ALTER TABLE booking_addon_events
  ADD COLUMN appointment_id UUID REFERENCES phorest_appointments(id),
  ADD COLUMN status TEXT NOT NULL DEFAULT 'accepted'
    CHECK (status IN ('accepted', 'declined', 'dismissed'));

ALTER TABLE service_addons
  ADD COLUMN linked_service_id TEXT;
```

### Files to Modify

| File | Change |
|------|--------|
| `booking_addon_events` table | Add `appointment_id` and `status` columns |
| `service_addons` table | Add `linked_service_id` column |
| `QuickBookingPopover.tsx` | Backfill appointment_id after creation; use linked_service_id; log dismissals |
| `CheckoutSummarySheet.tsx` | Add add-on breakdown section with margin badges |
| `ServiceAddonToast.tsx` | Pass dismiss metadata for decline tracking |
| `ServiceAddonsLibraryCard.tsx` | Add optional linked service picker in add-on form |
| `useStylistAddonAttachment.ts` | Update analytics to calculate attachment rate from accepted vs dismissed |

### Sequencing

1. Database migration (add columns)
2. Admin UI: linked_service_id picker in add-on form
3. Booking flow: resilient attachment + dismiss tracking + appointment_id backfill
4. Checkout: add-on breakdown display
5. Analytics: attachment rate calculation update

