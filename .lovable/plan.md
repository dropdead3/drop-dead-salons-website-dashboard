

## Redo / Adjustment Service Feature -- Full Build Plan

### Problem

When a client returns for a correction or redo, there is no structured way to flag it as such. The appointment looks identical to a regular booking, which means:
- No visibility into which stylists generate redos and how often
- No automatic pricing adjustments (most salons comp redos or charge reduced rates)
- No link between the original appointment and the correction
- No communication templates for the sensitive "we'll make this right" scenario
- No way to measure the financial impact of quality issues

---

### Architecture Overview

This feature adds a **Redo/Adjustment flag** to the existing booking and appointment infrastructure rather than creating a separate service category. It threads through four layers: data, booking UI, organization policy, and analytics.

```text
+-------------------------------+
|   Organization Settings       |
|   (redo pricing policy)       |
+-------------------------------+
         |
         v
+-------------------------------+
|   Booking Flow                |
|   (redo toggle + link to      |
|    original appointment)      |
+-------------------------------+
         |
         v
+-------------------------------+
|   Appointments Table          |
|   (is_redo, redo_reason,      |
|    original_appointment_id,   |
|    redo_pricing_override)     |
+-------------------------------+
         |
         v
+-------------------------------+
|   Analytics + Alerts          |
|   (redo rate by stylist,      |
|    financial impact, trends)  |
+-------------------------------+
```

---

### 1. Database Migration

**Table: `appointments`** -- add columns

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `is_redo` | `boolean` | `false` | Flag marking this as a redo/adjustment |
| `redo_reason` | `text` | `null` | Why the redo is needed (e.g., "Color didn't hold", "Uneven cut") |
| `original_appointment_id` | `uuid` (FK to appointments) | `null` | Links back to the original appointment |
| `redo_pricing_override` | `numeric` | `null` | Per-booking price override (null = use org policy) |
| `redo_approved_by` | `uuid` (FK to employee_profiles.user_id) | `null` | Manager/admin who approved the redo if approval is required |

**Organization settings** (stored in `organizations.settings` JSONB)

New keys within the existing `settings` JSONB column:

```json
{
  "redo_pricing_policy": "free",        // "free" | "percentage" | "custom" | "full_price"
  "redo_pricing_percentage": 50,         // used when policy = "percentage"
  "redo_requires_approval": false,       // if true, redo flag requires manager/admin sign-off
  "redo_approval_roles": ["admin", "manager"],  // who can approve
  "redo_reason_required": true,          // force reason entry
  "redo_window_days": 14,               // how many days after original apt a redo is valid
  "redo_notification_enabled": true      // send notification to manager when redo is flagged
}
```

No new tables needed. RLS is already in place on `appointments`.

---

### 2. Booking Flow Changes

**File: `QuickBookingPopover.tsx`**

On the **Confirm** step (step 5), add a collapsible "Redo / Adjustment" section:

1. **Toggle**: "This is a redo or adjustment" (Switch component)
2. When toggled ON, reveal:
   - **Original Appointment Picker**: Search by client name + date to find the original booking. Shows a compact card with the original service, date, and stylist.
   - **Reason field**: Required or optional based on org setting (`redo_reason_required`). Dropdown with common reasons + free text:
     - Color didn't hold
     - Uneven cut / missed spots
     - Client dissatisfied with style
     - Processing error
     - Other (free text)
   - **Price Override**: Shows the org's default redo pricing policy with the calculated price. Includes an override input for managers to set a custom price. Non-manager roles see the policy price as read-only.
   - **Approval Badge**: If `redo_requires_approval` is true and the current user is not in `redo_approval_roles`, show a "Pending Approval" badge. The booking is created with `status: 'pending'` until approved.

3. When the booking is submitted with `is_redo: true`:
   - The `create-phorest-booking` edge function receives the redo metadata
   - Price is adjusted per org policy (or override)
   - The `original_appointment_id` is stored
   - If approval is required, status is set to `pending` instead of `confirmed`

**File: `AppointmentDetailSheet.tsx`**

When viewing a redo appointment:
- Show a distinctive "Redo" badge next to the status badge
- Display the redo reason
- Link to the original appointment (clickable, opens that appointment's detail)
- Show who approved it (if approval was required)
- On the original appointment, show a "Has Redo" indicator linking forward

**File: `create-phorest-booking` edge function**

Add handling for redo fields:
- Accept `is_redo`, `redo_reason`, `original_appointment_id`, `redo_pricing_override`
- Look up org redo pricing policy to calculate final price if no override
- Validate `redo_window_days` (reject if original appointment is too old)
- Store all redo columns on the new appointment record

---

### 3. Organization Settings UI

**File: `src/components/dashboard/settings/` (new component: `RedoPolicySettings.tsx`)**

A settings card within the Services Settings page:

- **Pricing Policy**: Radio group -- Free / Percentage Discount / Custom Amount / Full Price
- **Discount Percentage**: Slider (0-100%) visible when "Percentage" is selected
- **Require Approval**: Switch -- when ON, redos from non-manager roles need sign-off
- **Approval Roles**: Multi-select of roles (admin, manager, super_admin)
- **Require Reason**: Switch -- force stylists to enter a reason
- **Redo Window**: Number input -- days after original appointment within which a redo is valid (default 14, max 90)
- **Manager Notification**: Switch -- notify managers when a redo is flagged

Reads/writes to `organizations.settings` JSONB.

**File: `ServicesSettingsContent.tsx`**

Add the `RedoPolicySettings` card to the settings grid.

---

### 4. Notification Flow

When a redo booking is created:
- If `redo_notification_enabled`: Send an internal notification (toast or push if configured) to managers at the location
- The notification includes: client name, original stylist, redo reason, and price applied
- Uses the existing `enqueue-service-emails` function pattern with a new `action: 'redo'` type
- Email template: empathetic, professional tone. "A redo has been scheduled for [Client] -- [Reason]. Original service by [Stylist] on [Date]."

---

### 5. Analytics

**New hook: `useRedoAnalytics.ts`**

Queries:
- Redo count and rate by stylist (last 30/60/90 days)
- Redo count by service category
- Redo count by reason
- Financial impact (sum of revenue difference between original price and redo price)
- Trend line (weekly redo count over time)
- Repeat redo clients (clients with 2+ redo appointments)

**Stats Dashboard (`Stats.tsx`)**

New card: **"Redo & Adjustment Insights"** (admin/manager only via VisibilityGate)

Contents:
- **Redo Rate KPI**: Total redos / Total appointments (last 30 days), with trend arrow
- **By Stylist**: Horizontal bar chart ranking stylists by redo count, with redo rate percentage
- **By Reason**: Pie or horizontal bar showing reason distribution
- **Financial Impact**: Total revenue foregone (original price - redo price summed)
- **Coaching Signal**: If any stylist exceeds a configurable threshold (e.g., >5% redo rate), flag with an alert badge

**Analytics Hub Integration**

Add redo rate as a metric in the Services Intelligence subtab alongside rebooking rate and efficiency metrics. This surfaces redo patterns in the context of service quality.

---

### 6. Overrides and Customization Summary

| Aspect | Default | Override |
|--------|---------|----------|
| Pricing | Org policy (free/percentage/etc.) | Per-booking price override by manager |
| Approval | Not required | Toggle on per org; role-restricted |
| Reason | Required | Toggle off per org |
| Window | 14 days | Configurable 1-90 days per org |
| Notifications | Enabled | Toggle off per org |
| Analytics threshold | 5% redo rate | Configurable in settings (future phase) |

---

### 7. Files Changed/Created

| File | Action |
|------|--------|
| **Migration** | Add `is_redo`, `redo_reason`, `original_appointment_id`, `redo_pricing_override`, `redo_approved_by` to `appointments` |
| `src/components/dashboard/settings/RedoPolicySettings.tsx` | **Create** -- org-level redo policy configuration card |
| `src/components/dashboard/settings/ServicesSettingsContent.tsx` | **Edit** -- add RedoPolicySettings to the grid |
| `src/components/dashboard/schedule/QuickBookingPopover.tsx` | **Edit** -- add redo toggle, reason picker, original appointment linker, price override on confirm step |
| `src/components/dashboard/schedule/AppointmentDetailSheet.tsx` | **Edit** -- show redo badge, reason, original link, approval status |
| `supabase/functions/create-phorest-booking/index.ts` | **Edit** -- accept and store redo metadata, apply pricing policy, validate redo window |
| `src/hooks/useRedoAnalytics.ts` | **Create** -- redo rate, by-stylist, by-reason, financial impact queries |
| `src/pages/dashboard/Stats.tsx` | **Edit** -- add Redo and Adjustment Insights card |

---

### 8. Build Sequence

1. Database migration (new columns on `appointments`)
2. `RedoPolicySettings.tsx` + wire into `ServicesSettingsContent.tsx`
3. Booking flow redo toggle and metadata in `QuickBookingPopover.tsx`
4. Edge function updates for redo handling
5. `AppointmentDetailSheet.tsx` redo display
6. `useRedoAnalytics.ts` hook
7. Stats dashboard redo card
8. Notification wiring (redo email/notification)

---

### 9. Gap Analysis and Edge Cases

- **What if the original appointment was from Phorest (imported)?** The linker should search both native and imported appointments by client + date range.
- **What if a different stylist does the redo?** Fully supported -- the redo tracks `original_appointment_id` which has the original stylist. The redo appointment has its own `staff_user_id`. Analytics attribute the redo to the *original* stylist.
- **Multi-location:** A redo could happen at a different location than the original. The original appointment link handles this transparently.
- **Redo of a redo:** Supported via the same `original_appointment_id` chain. Analytics can detect repeat redos.
- **Approval workflow:** If approval is required and the user is not authorized, the appointment is created as `pending`. Managers see it in their queue and can approve (setting `redo_approved_by` and changing status to `confirmed`).
- **Window expiration:** If the original appointment is older than `redo_window_days`, the UI shows a warning but still allows managers to override.

