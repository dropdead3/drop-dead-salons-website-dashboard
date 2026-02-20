

## Remove Payroll Deadline Card from Dashboard + Build Payroll Reminder Settings

### What changes

1. **Remove the `PayrollDeadlineCard` from the main dashboard** -- the `payroll_deadline` element in `DashboardHome.tsx` will be removed along with its import. The component file itself stays (it may be useful later or for reference), but it will no longer render on the Control Center dashboard.

2. **Build a "Payroll Reminders" settings card inside the Payroll Hub Settings tab** (`/dashboard/admin/payroll?tab=settings`) that lets admins configure:
   - **Reminder enabled/disabled** (org-level toggle)
   - **Reminder timing**: How many days before the payroll deadline to start sending reminders (e.g., 5 days, 3 days, 1 day)
   - **Notification channels**: Email, push notification, SMS toggles
   - **Escalation**: Whether to send an urgent notification if payroll is missed (the existing "deadline missed" logic)

3. **Database migration** to add reminder configuration columns to `organization_payroll_settings`:
   - `reminder_enabled` (boolean, default true)
   - `reminder_days_before` (integer[], default `{3, 1, 0}` -- 3 days, 1 day, and day-of)
   - `reminder_channels` (jsonb, default `{"email": true, "push": true, "sms_on_missed": true}`)

4. **Update the `check-payroll-deadline` edge function** to respect the new org-level reminder settings:
   - Check `reminder_enabled` before sending any notifications
   - Use `reminder_days_before` array to determine which days to notify (instead of only day-of and day-after)
   - Respect `reminder_channels` to decide which notification methods to use

5. **New UI component**: `PayrollReminderSettings` card placed in the Payroll Hub Settings tab, with:
   - Master toggle for reminders
   - Multi-select for reminder days (checkboxes: 5 days, 3 days, 1 day, day-of)
   - Channel toggles (email, push, SMS on missed deadline)
   - Clean, minimal design consistent with existing settings cards

---

### Technical details

**Files modified:**
- `src/pages/dashboard/DashboardHome.tsx` -- Remove `PayrollDeadlineCard` import and `payroll_deadline` entry from the dashboard elements map
- `src/pages/dashboard/admin/Payroll.tsx` -- Add `PayrollReminderSettings` component to the Settings tab
- `supabase/functions/check-payroll-deadline/index.ts` -- Update to read new columns and support multi-day reminders and channel filtering

**Files created:**
- `src/components/dashboard/payroll/PayrollReminderSettings.tsx` -- New settings card UI

**Database migration:**
```text
ALTER TABLE organization_payroll_settings
  ADD COLUMN reminder_enabled boolean DEFAULT true,
  ADD COLUMN reminder_days_before integer[] DEFAULT '{3,1,0}',
  ADD COLUMN reminder_channels jsonb DEFAULT '{"email": true, "push": true, "sms_on_missed": true}';
```

**Edge function logic update:**
- Instead of checking only `isDeadlineDay` and `isMissedDeadline`, calculate `daysUntilDeadline` and check if it matches any value in `reminder_days_before`
- Before sending email/push/SMS, check the corresponding key in `reminder_channels`
- Skip the entire org if `reminder_enabled` is false

