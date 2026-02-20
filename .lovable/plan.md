

## Add Break / Time-Off Scheduling from Booking Wizard

### Overview
Add an "Add Break" button above "Skip Services" in the booking popover that lets staff block time on their schedule. Stylists can only block time for themselves; admins/managers can block for anyone. Additionally, build a configurable time-off approval setting so account owners can choose whether time-off requests require approval or are auto-approved.

---

### 1. Database Changes

**Migration: Add `time_off_requires_approval` to organization settings**

The `organizations` table already has a `settings` JSONB column. We will add a dedicated boolean column for clarity and query safety:

```sql
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS time_off_requires_approval BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.organizations.time_off_requires_approval
IS 'When false, time-off requests are auto-approved and immediately block the schedule.';
```

**Migration: Add `start_time` and `end_time` to `time_off_requests`**

The existing table only has `start_date` and `end_date` (date-only). To support partial-day breaks (e.g., 2-hour lunch block), we need optional time columns:

```sql
ALTER TABLE public.time_off_requests
ADD COLUMN IF NOT EXISTS start_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS end_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_full_day BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS blocks_online_booking BOOLEAN NOT NULL DEFAULT true;
```

- `is_full_day = true` means the entire day(s) are blocked.
- `start_time / end_time` are used when `is_full_day = false` (a break or partial block).
- `blocks_online_booking = true` prevents clients from booking online during this window.

---

### 2. Auto-Approval Logic

When a stylist submits a break/time-off and the org has `time_off_requires_approval = false`:
- The request status is set to `approved` immediately (instead of `pending`).
- A calendar event is created automatically to block the schedule.
- A toast confirms "Break scheduled" (no "pending approval" language).

When `time_off_requires_approval = true`:
- The request is created as `pending`.
- A toast says "Time off request submitted for approval."
- Admins see pending requests in their existing review flow.

---

### 3. UI: "Add Break" Button in QuickBookingPopover

**File:** `src/components/dashboard/schedule/QuickBookingPopover.tsx`

Add a secondary button above "Skip Services" in the service step footer:

```
[ Add Break        ]   <-- ghost/outline button, Coffee icon
[ Skip Services    ]   <-- existing button
```

Clicking "Add Break" opens a compact inline form (replaces the service list) with:
- **Type selector**: Break, Personal, Sick, Vacation, Other (pill/chip selector)
- **Duration**: Quick presets (30 min, 1 hour, 2 hours, Half Day, Full Day) or custom time range
- **Date**: Pre-filled from the selected slot date
- **Start time**: Pre-filled from the selected slot time
- **Notes**: Optional text field
- **For whom**: (Admin/manager only) Dropdown of team members; stylists see only their own name, locked

The form renders inside the same popover/panel, replacing the service category list. A "Back" link returns to services.

---

### 4. Submission Flow

On submit:
1. Check org setting `time_off_requires_approval`.
2. Insert into `time_off_requests` with appropriate status (`approved` or `pending`).
3. If auto-approved, also insert a `team_calendar_events` entry with `event_type = 'time_off'` and create an `appointments` entry with `service_category = 'Block'` and `service_name = 'Break'` to visually block the schedule slot and prevent double-booking.
4. Close the popover and invalidate schedule queries.

---

### 5. Permission Enforcement

- **Stylists** (`stylist`, `stylist_assistant` roles): Can only create breaks for themselves. The "For whom" field is locked to their own profile.
- **Admins/managers** (`admin`, `manager`, `super_admin`): Can create breaks for any team member via a staff dropdown.
- RLS on `time_off_requests` already enforces that users can only insert with `user_id = auth.uid()`. For admin-on-behalf-of submissions, we will use a small edge function or a database function that checks admin status before inserting with a different `user_id`.

---

### 6. Schedule Blocking Effect

When a break/time-off is approved:
- An appointment record is inserted with `service_category = 'Block'`, `service_name = 'Break'` (or the time-off type), and `status = 'confirmed'`.
- The existing schedule views (Day/Week) already render Block-category appointments with dark styling.
- The existing conflict-check logic (`check_booking_conflicts` DB function) will detect the blocked slot and prevent overlapping bookings.
- Online booking availability checks will exclude these slots.

---

### 7. Admin Setting: Time-Off Approval Toggle

**File:** New section in existing schedule/team settings page.

A simple toggle: "Require approval for time-off requests" (default: on).
- Reads/writes `organizations.time_off_requires_approval`.
- Advisory copy: "When disabled, staff can immediately block their own schedule without manager review."

---

### 8. Files Changed / Created

| File | Action |
|------|--------|
| `supabase/migrations/...` | New migration for DB changes |
| `src/components/dashboard/schedule/QuickBookingPopover.tsx` | Add "Add Break" button + inline break form |
| `src/components/dashboard/schedule/AddBreakForm.tsx` | **New** -- Compact break/time-off form component |
| `src/hooks/useTimeOffRequests.ts` | Enhance `useCreateTimeOffRequest` to support auto-approval + schedule blocking |
| `src/hooks/useOrganizationSettings.ts` | **New or enhanced** -- Hook to read/write `time_off_requires_approval` |
| Schedule settings page | Add approval toggle |

