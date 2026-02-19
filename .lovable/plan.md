

## Assistant Stylists on Appointments

This feature adds the ability to assign assistant stylists to scheduled appointments. The drill-down will show "Assisted by [Name]" when an assistant is linked, and those appointments will also appear on the assistant's calendar.

### What Changes

**1. New database table: `appointment_assistants`**
A junction table linking appointments to assistant user IDs:
- `id` (UUID, PK)
- `appointment_id` (UUID, FK to `phorest_appointments.id`)
- `assistant_user_id` (UUID, FK to `auth.users`)
- `organization_id` (UUID, FK to `organizations.id`)
- `created_at`, `created_by`

RLS policies scoped to org members. Index on `appointment_id` and `assistant_user_id`.

**2. Update live session hook: `src/hooks/useLiveSessionSnapshot.ts`**
- After resolving active appointments, query `appointment_assistants` for those appointment IDs
- Join to `employee_profiles` to get assistant names
- Add `assistedBy: string | null` to the `StylistDetail` interface

**3. Update drill-down UI: `src/components/dashboard/LiveSessionDrilldown.tsx`**
- Below the service name, show "Assisted by [Name]" in a subtle label when present
- Update demo data to include a few entries with assistant names

**4. Update calendar hook: `src/hooks/usePhorestCalendar.ts`**
- Expand the appointment query to also fetch appointments where the current user is listed as an assistant in `appointment_assistants`
- Merge these into the calendar results so assistants see the appointments on their schedule

**5. Add "Assign Assistant" UI on appointment detail**
- Add a small action (button or dropdown) on the appointment card or detail view to assign an assistant stylist
- Filtered to users with the `stylist_assistant` role in the same organization
- Creates a row in `appointment_assistants`

---

### Technical Details

**Database migration:**
```sql
CREATE TABLE IF NOT EXISTS public.appointment_assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.phorest_appointments(id) ON DELETE CASCADE,
  assistant_user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(appointment_id, assistant_user_id)
);

ALTER TABLE public.appointment_assistants ENABLE ROW LEVEL SECURITY;
-- RLS: org members can view/create/delete
```

**StylistDetail interface update:**
```typescript
interface StylistDetail {
  // existing fields...
  assistedBy: string | null; // assistant display name
}
```

**Drill-down row addition:**
```text
Sarah M
Balayage & Tone
Assisted by Jamie R          <-- new line, muted italic
Appointment 3 of 5
```

**Calendar query expansion:**
```typescript
// Also fetch appointments where user is an assistant
const { data: assistedAppts } = await supabase
  .from('appointment_assistants')
  .select('appointment_id')
  .eq('assistant_user_id', userId);
// Merge those appointment IDs into the main query
```

### Files Created
- Database migration (via migration tool)

### Files Modified
- `src/hooks/useLiveSessionSnapshot.ts` (add assistant lookup)
- `src/components/dashboard/LiveSessionDrilldown.tsx` (show "Assisted by" + update demo data)
- `src/hooks/usePhorestCalendar.ts` (include assistant appointments in calendar)
- Appointment detail component (add assign-assistant action)

