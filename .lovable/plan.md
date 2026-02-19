

## Add Scheduling Conflict Warning When Assigning Assistants

Yes, the system already supports multiple assistants per appointment (the DB unique constraint is on `appointment_id + assistant_user_id`, not on `appointment_id` alone). The gap is that there is no warning when you assign someone who is already booked on another overlapping appointment.

### What Changes

**1. New hook: `src/hooks/useAssistantConflictCheck.ts`**

A lightweight hook that, given a date and time range, fetches all `phorest_appointments` that overlap that window and checks which team members are either:
- The **lead stylist** (`stylist_user_id`) on an overlapping appointment
- An **assigned assistant** (`appointment_assistants.assistant_user_id`) on an overlapping appointment

Returns a `Map<userId, conflictingAppointment[]>` so the picker can look up conflicts per candidate.

Query logic:
```
SELECT pa.id, pa.start_time, pa.end_time, pa.client_name, pa.service_name,
       pa.stylist_user_id,
       aa.assistant_user_id
FROM phorest_appointments pa
LEFT JOIN appointment_assistants aa ON aa.appointment_id = pa.id
WHERE pa.appointment_date = <date>
  AND pa.start_time < <end_time>
  AND pa.end_time > <start_time>
  AND pa.status NOT IN ('cancelled', 'no_show')
  AND pa.id != <current_appointment_id>
```

This is a single query, done once when the picker opens, covering both lead and assistant conflicts.

**2. Update: `src/components/dashboard/schedule/AppointmentDetailSheet.tsx`**

In the assistant picker list (lines 340-373):
- Import and call the new conflict check hook, passing the current appointment's date, start_time, end_time, and id
- For each candidate in the picker, check if they have conflicts
- If conflicting, show a warning row:
  - Orange `AlertTriangle` icon next to their name
  - Subtle text like "Busy 10:00-11:30 (Cut & Color)" showing the overlapping appointment
- The user can **still assign** them (it is a warning, not a block) -- some assistants may float between appointments intentionally
- The warning uses existing `AlertTriangle` icon (already imported) and muted orange styling

### Layout of Picker With Conflict

```
[Avatar] Jamie R.
         [!] Busy 10:00 - 11:30 (Cut & Color for Jessica S.)

[Avatar] Alex T.                        <-- no conflict, clean row

[Avatar] Morgan K.
         [!] Assisting 9:30 - 10:45 (Balayage for Sarah M.)
```

### What Does NOT Change

- Revenue attribution -- still only counts for the lead stylist
- The ability to assign multiple assistants -- already works
- The DB trigger preventing self-assignment -- already in place
- Existing assistant display, duration tracking, and notifications -- untouched

### Technical Summary

| File | Change |
|------|--------|
| `src/hooks/useAssistantConflictCheck.ts` | New hook -- fetches overlapping appointments and builds a conflict map per user |
| `src/components/dashboard/schedule/AppointmentDetailSheet.tsx` | Wire conflict data into picker, show warning rows for busy candidates |

Two files total. No database changes needed.

