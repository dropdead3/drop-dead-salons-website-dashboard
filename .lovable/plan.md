

## Fix: Break Scheduling Bug + Front Desk Team Search

### Root Cause

The "Schedule Break" button fails silently because the `create_break_request` database function tries to insert a `reason` value into the `time_off_requests` table, but that column doesn't exist. The RPC call errors out, and the toast shows "Failed to schedule break."

### Changes

**1. Database Migration -- Add `reason` column**

Add the missing `reason` column to `time_off_requests`:
```sql
ALTER TABLE public.time_off_requests
  ADD COLUMN IF NOT EXISTS reason TEXT DEFAULT 'break';
```

This makes the RPC function work as designed.

**2. Front Desk Team Member Search (AddBreakForm.tsx)**

Currently, admins/managers/front desk see a simple `<Select>` dropdown to pick a team member. For front desk users (and admins), replace this with a searchable input using `cmdk` (already installed) or a simple filtered input:

- Add a text input above the dropdown that filters team members by name
- Front desk roles (`front_desk`, `receptionist`) will be treated like admin for the break form's team selector (they need to schedule breaks for stylists)
- Stylists keep the current behavior: auto-selected to themselves, no team picker shown

**3. Auto-select logged-in stylist**

For users with stylist/stylist_assistant roles, the break always schedules for themselves (current behavior already works via `defaultStylistId || user?.id`). No change needed here.

### Technical Details

**File: Database Migration**
- Add `reason TEXT DEFAULT 'break'` column to `time_off_requests`

**File: `src/components/dashboard/schedule/AddBreakForm.tsx`**
- Expand `isAdmin` check to include `front_desk` and `receptionist` roles
- Replace the `<Select>` with a searchable input + filtered list using a text `<Input>` and filtering `teamMembers` by the search query
- Keep the auto-selection logic for non-admin/non-front-desk users (stylists schedule for themselves)

### Summary
- One database migration (add missing column)
- One component update (searchable team picker for front desk)
- Fixes the core bug preventing any break from being scheduled

