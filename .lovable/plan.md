

## Redo Feature -- Deep Dive Gap Analysis and Enhancements

### Summary

The redo feature has strong UI scaffolding and a working booking flow, but several **critical data consistency issues** and **missing utility features** remain. This plan organizes findings into three tiers: Critical (data integrity), Important (functional completeness), and Enhancement (extreme utility).

---

### CRITICAL: Table Mismatch (Data Integrity)

The edge function `create-phorest-booking` writes redo metadata to **`phorest_appointments`**, but three downstream consumers read from **`appointments`**:

| Consumer | Table Used | Problem |
|----------|-----------|---------|
| `useRedoAnalytics.ts` | `appointments` | Will never find redo data |
| `ClientRedoHistory.tsx` | `appointments` | Will never find redo data |
| Approve/Decline mutations in `AppointmentDetailSheet.tsx` | `appointments` | Updates go to wrong table |
| Forward link query in `AppointmentDetailSheet.tsx` | `appointments` | Will never find linked redos |

**Fix:** All four queries must be updated to read from `phorest_appointments` (the table the edge function actually writes to). The approve/decline mutations must also write to `phorest_appointments`.

---

### CRITICAL: Approval Actions Missing Role Gate

The "Approve Redo" and "Decline" buttons render for **all users** when an appointment has `status === 'pending'`. There is no check for `isManagerOrAdmin`. Any stylist viewing a pending redo can approve or decline it.

**Fix:** Wrap the approval action block with `{isManagerOrAdmin && (...)}`.

---

### IMPORTANT: Walk-In Dialog Has No Redo Support

The `WalkInDialog` component creates appointments via the `create_booking` database function, completely bypassing the redo flow. Walk-ins that are corrections cannot be flagged as redos.

**Fix:** Add a redo toggle, reason picker, and original appointment selector to `WalkInDialog.tsx`, mirroring the QuickBookingPopover implementation. Pass redo metadata to the `create_booking` function (or call the edge function instead).

---

### IMPORTANT: Original Appointment Picker Excludes Native Appointments

The picker queries only `phorest_appointments` (line 178 of QuickBookingPopover). If the original service was booked through the native booking system and lives in `appointments`, it will not appear in the picker.

**Fix:** Query both `phorest_appointments` and `appointments` tables, then merge and deduplicate by date/service.

---

### IMPORTANT: Redo Price Not Passed to Edge Function Correctly

When the user does NOT set a manual override, the computed redo price is calculated in the UI but never sent to the edge function. The edge function re-calculates independently, which works -- but the `total_price` displayed at booking time may differ from what gets stored if the org settings change between render and submission.

**Fix:** Always compute and send the final redo price as `redo_pricing_override` from the UI to ensure consistency between what's displayed and what's stored.

---

### IMPORTANT: `canBook` Allows Redo Without Original Appointment Link

Currently, `canBook` validates the redo reason but does NOT require an original appointment to be selected. A redo can be booked without linking it to any original service, which defeats the purpose of attribution and analytics.

**Fix:** Add `(!isRedo || !!originalAppointmentId)` to the `canBook` condition (or at minimum show a strong warning).

---

### IMPORTANT: Redo Analytics Query Filters by `organization_id`

The `useRedoAnalytics` hook filters `appointments` by `organization_id`, but `phorest_appointments` does not have an `organization_id` column. Even after switching the table, the query needs a different join strategy (e.g., through `locations` or `phorest_staff_mapping`).

**Fix:** When switching to `phorest_appointments`, join through the staff-to-org mapping or add a location-based filter instead of direct `organization_id` equality.

---

### ENHANCEMENT: Redo-to-Coaching Pipeline

When a stylist crosses the configurable redo threshold (default 5%), there is no integration with the existing coaching/1:1 system. The analytics card shows a red badge but takes no action.

**What to build:**
- When redo analytics detect a stylist above threshold, auto-create a coaching topic or flag in the 1:1 meeting prep system (if one exists).
- At minimum, surface a "Schedule coaching conversation" action button next to the flagged stylist in the analytics card.

---

### ENHANCEMENT: Commission Impact Visibility

Redos priced at $0 (complimentary) or discounted rates reduce stylist commission earnings, but this is invisible. Commission tracking does not account for whether revenue came from a redo.

**What to build:**
- In commission calculation or display, annotate redo-sourced revenue separately.
- In the analytics card, add a "Commission Impact" row showing how much commission was lost due to redos.

---

### ENHANCEMENT: Redo Export and Reporting

There is no way to export redo data for external analysis (e.g., insurance claims, vendor quality disputes, owner reporting).

**What to build:**
- Add a "Download CSV" button on the redo analytics card that exports redo appointments with reason, stylist, original price, redo price, and date.

---

### ENHANCEMENT: Redo Reason Customization Per Organization

The `REDO_REASONS` array is hardcoded in `useRedoPolicySettings.ts`. Different salon types may need different reason sets (e.g., a color-focused salon needs more granular color reasons).

**What to build:**
- Store custom redo reasons in `organizations.settings` as `redo_custom_reasons: string[]`.
- Fall back to the default `REDO_REASONS` if none are configured.
- Add a "Custom Reasons" editor to `RedoPolicySettings.tsx`.

---

### Build Sequence

| # | Item | Priority | Complexity |
|---|------|----------|------------|
| 1 | Fix table mismatch (analytics, history, approve/decline, forward link) | Critical | Low |
| 2 | Gate approve/decline buttons behind `isManagerOrAdmin` | Critical | Trivial |
| 3 | Require original appointment link in `canBook` | Important | Trivial |
| 4 | Send computed redo price to edge function | Important | Low |
| 5 | Fix analytics org filter for `phorest_appointments` | Important | Medium |
| 6 | Walk-In Dialog redo support | Important | Medium |
| 7 | Original appointment picker: query both tables | Important | Low |
| 8 | Redo reason customization per org | Enhancement | Low |
| 9 | Redo CSV export | Enhancement | Low |
| 10 | Commission impact visibility | Enhancement | Medium |
| 11 | Coaching pipeline integration | Enhancement | Medium |

### Files Affected

- `src/hooks/useRedoAnalytics.ts` -- Switch to `phorest_appointments`, fix org filter
- `src/components/dashboard/clients/ClientRedoHistory.tsx` -- Switch to `phorest_appointments`
- `src/components/dashboard/schedule/AppointmentDetailSheet.tsx` -- Fix approve/decline table, add role gate, fix forward link table
- `src/components/dashboard/schedule/QuickBookingPopover.tsx` -- Enforce original appointment in `canBook`, send computed price
- `src/components/dashboard/operations/WalkInDialog.tsx` -- Add redo toggle and metadata
- `src/hooks/useRedoPolicySettings.ts` -- Add custom reasons support
- `src/components/dashboard/settings/RedoPolicySettings.tsx` -- Add custom reasons editor
- `src/pages/dashboard/Stats.tsx` -- Add CSV export button, commission impact row

