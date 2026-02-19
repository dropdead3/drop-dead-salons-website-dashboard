

## Assistant Stylist System -- Gap Analysis and Enhancements

After a deep review of the codebase, here are the remaining gaps and recommended improvements, grouped by priority.

---

### 1. Live View only shows ONE assistant per appointment

**Gap:** In `useLiveSessionSnapshot.ts`, the `assistantMap` is a simple `Map<string, string>` (appointment_id to single name). If multiple assistants are assigned, only the last one written wins. The `StylistDetail.assistedBy` is typed as `string | null` -- a single value.

**Fix:** Change `assistedBy` to `string[]` (array of names). Update `LiveSessionDrilldown.tsx` to render multiple badges when more than one assistant is present.

---

### 2. No UI to set `assist_duration_minutes`

**Gap:** The column was added to the database, and the analytics hook reads it, but there is no way for a user to actually record an assist duration. It always falls back to the full appointment duration estimate.

**Fix:** Add an optional duration input to the assistant row inside `AppointmentDetailSheet.tsx`. A small inline number input (e.g., "45 min") next to each assigned assistant, saved on blur or via a small save button.

---

### 3. Assistant picker allows assigning the lead stylist (client-side)

**Gap:** The DB trigger `prevent_self_assistant_assignment` catches this server-side, but the UI still shows the lead stylist in the picker list when `stylist_user_id` is `null` (Phorest-imported appointments with unmapped staff). The user sees an error toast after a failed insert rather than the option being hidden.

**Fix:** Also filter by `phorest_staff_id` mapping in the picker, or at minimum show a clearer inline validation message instead of relying on the DB error.

---

### 4. Notifications table insert may fail silently if `notifications` table doesn't exist for org

**Gap:** In `useAppointmentAssistants.ts`, the notification insert is wrapped in a try/catch that swallows all errors. This is fine as a non-blocking pattern, but there is no logging or retry. If notifications consistently fail for an org, no one would know.

**Fix:** Add a `console.warn` inside the catch so it surfaces in dev tools during debugging. Low priority but good hygiene.

---

### 5. Assistant Activity card has no org filter on the query

**Gap:** In `useAssistantActivity.ts`, the query fetches all `appointment_assistants` rows for the org but then filters by date in JS rather than in the SQL query. This means it pulls ALL historical records every time and filters client-side, which will degrade as data grows.

**Fix:** Add a server-side date filter by joining on `phorest_appointments.appointment_date` directly in the query, or at minimum adding a `.gte` / `.lte` on the appointment date range.

---

### 6. Revenue attribution is sound -- but no "assisted revenue" metric exists

**Gap:** Revenue correctly counts only for the lead stylist. But there is no visibility into "how much revenue did this assistant help generate?" -- a useful metric for justifying assistant labor costs.

**Fix:** Add an "Assisted Revenue" column to the `AssistantActivityCard` showing the sum of `total_price` from appointments where the person was an assistant. This is read-only attribution, not double-counting.

---

### 7. Calendar "ASSISTING" badge only shows for the logged-in user

**Gap:** The `assistedAppointmentIds` set is built by querying `appointment_assistants` where `assistant_user_id = currentUser`. For admins/managers viewing all stylists, there is no indication of which appointments have assistants assigned at all.

**Fix:** For admin/manager views, query ALL assistant assignments for the visible date range and show a small team icon or indicator on any appointment that has at least one assistant, regardless of who it is.

---

### Summary of changes

| # | Enhancement | Scope | Priority |
|---|-------------|-------|----------|
| 1 | Multi-assistant support in Live View | `useLiveSessionSnapshot.ts`, `LiveSessionDrilldown.tsx` | High |
| 2 | Duration input for assist tracking | `AppointmentDetailSheet.tsx`, `useAppointmentAssistants.ts` | High |
| 3 | Better self-assignment guard in UI | `AppointmentDetailSheet.tsx` | Medium |
| 4 | Notification failure logging | `useAppointmentAssistants.ts` | Low |
| 5 | Server-side date filtering for activity | `useAssistantActivity.ts` | Medium |
| 6 | "Assisted Revenue" metric | `useAssistantActivity.ts`, `AssistantActivityCard.tsx` | Medium |
| 7 | Admin-visible assistant indicators on calendar | `usePhorestCalendar.ts`, `DayView.tsx`, `WeekView.tsx` | Medium |

