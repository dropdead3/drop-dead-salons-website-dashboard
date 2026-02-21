

## Clarify and Enhance Break vs Block Scheduling

### The Problem

Right now there are two scheduling block types defined in settings — **Break** and **Block** — but:

1. The UI only lets you create "Breaks" (via the Coffee icon in QuickBookingPopover and the right-click context menu)
2. There is no way to create a "Block" (admin tasks, training, meetings, cleaning) from anywhere in the app
3. The database function `create_break_request` hardcodes `service_category = 'Block'` for ALL entries, so even lunch breaks are stored as category "Block" — meaning the "Break" color in settings is never actually used on the calendar
4. For payroll (Gusto), **breaks** (meal, rest) have legal tracking requirements while **blocks** (admin time, training) are just productive non-service hours — these must be distinguishable

### What This Plan Does

**Rename and expand the AddBreakForm into a unified "Add Time Block" form** that lets admins choose between Break-type entries and Block-type entries, each with their own sub-reasons. Fix the database function so the correct `service_category` is written, and the calendar renders both types with their distinct colors.

### Detailed Changes

**1. Expand the type system**

Current `BreakType`: `break | personal | sick | vacation | other`

New approach — two top-level modes with sub-reasons:

| Mode | service_category | Sub-reasons | Payroll relevance |
|------|-----------------|-------------|-------------------|
| Break | `Break` | Lunch, Rest Break, Personal Break | Tracked as break time (meal/rest period laws) |
| Block | `Block` | Admin Tasks, Training, Meeting, Cleaning, Personal Time, Other | Tracked as non-service hours |

**2. Update `AddBreakForm.tsx` -> rename to `AddTimeBlockForm.tsx`**

- Add a top-level toggle: "Break" vs "Block" (two large selectable cards)
- When "Break" is selected, show break-specific sub-reasons (Lunch, Rest Break, Personal Break) and duration presets suited for breaks (15 min, 30 min, 1 hour)
- When "Block" is selected, show block-specific sub-reasons (Admin Tasks, Training, Meeting, Cleaning, Personal Time, Other) and broader duration presets (30 min, 1 hour, 2 hours, Half Day, Full Day)
- Update header icon: Coffee for breaks, Clock for blocks
- Update submit button text: "Schedule Break" vs "Schedule Block"

**3. Fix the DB function `create_break_request`**

Create a new migration that updates the function to accept a `p_block_mode` parameter (`'Break'` or `'Block'`):

```sql
-- Currently hardcoded:
'Block', INITCAP(p_reason)

-- Will become:
p_block_mode, INITCAP(p_reason)
```

This ensures the correct `service_category` is written to the `appointments` table so that calendar rendering uses the right color.

**4. Update the hook (`useTimeOffRequests.ts`)**

- Add `block_mode: 'Break' | 'Block'` to `CreateBreakInput`
- Pass it through to the RPC call as `p_block_mode`
- Update toast messages to reflect the chosen mode

**5. Update all entry points**

- **QuickBookingPopover**: The Coffee button text changes to "Add Break / Block". Show the updated form.
- **Schedule.tsx context menu**: Rename "Add Break" to "Add Break / Block". Show the updated form.
- **DayView.tsx / WeekView.tsx**: Already render both categories with the X-pattern overlay — no changes needed here since fixing the `service_category` write is what makes them display correctly.

**6. Update settings card description**

In `ServicesSettingsContent.tsx`, enhance the Scheduling Blocks card description for each type:
- **Block**: "Non-service hours (admin tasks, training, meetings)"
- **Break**: "Rest periods (lunch, rest breaks) — tracked for payroll compliance"

### Build Sequence

| # | Item | Complexity |
|---|------|-----------|
| 1 | New migration: update `create_break_request` to accept `p_block_mode` | Low |
| 2 | Update `CreateBreakInput` and hook to pass `block_mode` | Trivial |
| 3 | Rename and expand `AddBreakForm` to `AddTimeBlockForm` with mode toggle | Medium |
| 4 | Update QuickBookingPopover and Schedule.tsx to use new component name and labels | Low |
| 5 | Update settings card descriptions | Trivial |

### Files Affected

- `supabase/migrations/` — New migration to update `create_break_request` function
- `src/components/dashboard/schedule/AddBreakForm.tsx` — Rename to `AddTimeBlockForm.tsx`, add mode toggle
- `src/hooks/useTimeOffRequests.ts` — Add `block_mode` to input and RPC call
- `src/components/dashboard/schedule/QuickBookingPopover.tsx` — Update import, button label
- `src/pages/dashboard/Schedule.tsx` — Update import, context menu label, dialog title
- `src/components/dashboard/settings/ServicesSettingsContent.tsx` — Enhanced descriptions

### Payroll Integration Readiness

Once this is in place, the `appointments` table will have clean data: `service_category = 'Break'` for legally tracked rest periods and `service_category = 'Block'` for productive non-service time. When Gusto integration lands, the payroll sync can:
- Sum `Break` entries as "break hours" for labor law compliance reporting
- Sum `Block` entries as "non-billable hours" for utilization calculations
- Neither counts toward service revenue or commission

