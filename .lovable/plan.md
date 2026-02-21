

## Redo Feature Gap Closure -- Remaining Build Items

### What's Already Working
- Database schema (all 5 redo columns on appointments)
- Redo Policy Settings card (pricing, window, approval toggle, reason requirement, notifications toggle)
- Booking flow redo toggle with reason picker, pricing indicator, manager override input, approval warning
- Edge function accepts redo metadata
- Redo badge + reason display on AppointmentDetailSheet
- Redo analytics card on Stats (rate, by stylist, by reason, financial impact)

---

### Gap 1: Original Appointment Picker (Critical)

The `originalAppointmentId` state variable exists but is never set -- there's no UI to link a redo to the original appointment.

**What to build:**
- In `QuickBookingPopover.tsx`, after the Reason field, add an "Original Appointment" section
- When the client is already selected, query their recent appointments (last N days based on `redo_window_days`) from the `appointments` table
- Display as a compact selectable list: service name, date, stylist name
- Selecting one sets `originalAppointmentId` and auto-populates the pricing reference (original price)
- If no client selected yet, show a disabled state: "Select a client first"
- If the selected original appointment is outside the redo window, show an amber warning but still allow managers to proceed

**Files:** `QuickBookingPopover.tsx`

---

### Gap 2: Forward Link on Original Appointment

When viewing the original appointment's detail, there's no indication that a redo was booked for it.

**What to build:**
- In `AppointmentDetailSheet.tsx`, query appointments where `original_appointment_id = current appointment.id`
- If any exist, show a "Redo Scheduled" badge with a link to the redo appointment (date, stylist)
- Clicking opens that appointment's detail sheet

**Files:** `AppointmentDetailSheet.tsx`

---

### Gap 3: Redo Pricing Applied to Total

The policy badge shows the pricing type but doesn't actually compute or apply the adjusted price.

**What to build:**
- In `QuickBookingPopover.tsx`, when redo is toggled ON and an original appointment is linked:
  - Fetch the original appointment's `total_price`
  - Calculate the redo price based on org policy (free = 0, percentage = original * percentage/100, full = original price)
  - Display the calculated price clearly
  - If the manager enters an override, that takes precedence
  - Pass the final computed price as `redo_pricing_override` (or adjust `total_price` directly)
- In `create-phorest-booking` edge function: if `is_redo` and no `redo_pricing_override`, look up the org's policy and the original appointment's price to compute the final `total_price`

**Files:** `QuickBookingPopover.tsx`, `create-phorest-booking/index.ts`

---

### Gap 4: Redo Window Validation in Edge Function

The redo window setting exists but isn't enforced.

**What to build:**
- In `create-phorest-booking`, when `is_redo` and `original_appointment_id` are provided:
  - Fetch the original appointment's date
  - Fetch the org's `redo_window_days` from settings
  - If the difference exceeds the window, return an error (unless a manager override flag is passed)

**Files:** `create-phorest-booking/index.ts`

---

### Gap 5: Approval Workflow (Pending Queue)

The approval warning shows in the UI but the appointment is still created as `confirmed`.

**What to build:**
- In booking submission: if `is_redo` and `redo_requires_approval` and the current user is not in `redo_approval_roles`, set the appointment status to `pending` instead of `confirmed`
- In `AppointmentDetailSheet.tsx`: for pending redo appointments, show an "Approve" button visible only to managers/admins
  - Approving sets `redo_approved_by` to the current user's ID and changes status to `confirmed`
  - Declining changes status to `cancelled` with a note
- On the schedule view, pending redos should appear with a distinctive visual treatment (amber/dashed border or similar)

**Files:** `QuickBookingPopover.tsx`, `AppointmentDetailSheet.tsx`, `create-phorest-booking/index.ts`

---

### Gap 6: Manager Notification on Redo Booking

The toggle exists but no notification fires.

**What to build:**
- After a redo booking is created in the edge function, if `redo_notification_enabled` is true:
  - Query managers at the appointment's location
  - Insert a record into a notifications mechanism (in-app toast via realtime, or leverage the existing `enqueue-service-emails` pattern with action type `redo`)
  - Notification content: client name, original stylist, redo reason, price applied

**Files:** `create-phorest-booking/index.ts`

---

### Gap 7: Enhanced Analytics (Trend Line + Repeat Redo Clients)

Current analytics show aggregate counts but miss longitudinal trends.

**What to build:**
- In `useRedoAnalytics.ts`, add:
  - Weekly redo count for the last 12 weeks (for a trend sparkline)
  - "Repeat redo clients" -- clients with 2+ redo appointments in the period
- In `Stats.tsx` redo card:
  - Add a small trend sparkline next to the redo rate KPI
  - Add a "Repeat Redo Clients" count (clients needing multiple corrections signals a deeper quality issue)

**Files:** `useRedoAnalytics.ts`, `Stats.tsx`

---

### Build Sequence

1. Original Appointment Picker (Gap 1) -- unlocks Gaps 3 and 4
2. Redo pricing calculation (Gap 3) -- depends on picker
3. Redo window validation (Gap 4) -- depends on picker
4. Forward link on original appointment (Gap 2) -- independent
5. Approval workflow (Gap 5) -- independent
6. Manager notification (Gap 6) -- independent
7. Enhanced analytics (Gap 7) -- independent

| Gap | Priority | Complexity |
|-----|----------|------------|
| Original Appointment Picker | High | Medium |
| Redo Pricing Applied | High | Low |
| Redo Window Validation | Medium | Low |
| Forward Link | Medium | Low |
| Approval Workflow | Medium | Medium |
| Manager Notification | Low | Medium |
| Enhanced Analytics | Low | Low |

