

# Payroll Deadline Card: Smart Timing + Missed-Deadline Notifications

## What Changes

### 1. Smart Visibility for the Payroll Deadline Card

The card currently shows at all times. It will now follow a **timeliness rule**:

- **Hidden** when the deadline is more than 5 days away (no noise)
- **Visible (calm)** when 2-5 days remain before deadline
- **Visible (urgent/amber)** when within 48 hours of deadline
- **Visible (critical/red)** when past deadline AND payroll has not been submitted for the current period
- **Hidden again** once payroll has been submitted for the current period

The component will query `payroll_runs` to check if a run exists for the current pay period. If a matching run with status `submitted`, `processed`, or `completed` exists, the card disappears -- payroll is handled.

### 2. New Edge Function: `check-payroll-deadline`

A scheduled function (cron) that runs once daily (e.g., 9 AM). It checks:

- Is today the period end date (deadline day)? If yes, and no payroll run exists for this period, send a **deadline-day warning** via email and push notification to all users with `manage_payroll` permission.
- Is today the day AFTER the deadline? If yes, and still no payroll run, send a **missed deadline alert** (escalation) via email, push, and SMS to the same users.

This ensures the notification fires **at deadline** and **after deadline if payroll was not run**, exactly as requested.

### 3. New SMS Template: `payroll_deadline_missed`

Added to the `sms_templates` table:
- **Key:** `payroll_deadline_missed`
- **Message:** `URGENT: Payroll for {{period_range}} was due {{deadline_date}} and has not been submitted. Please run payroll immediately. {{action_url}}`
- **Variables:** `period_range`, `deadline_date`, `action_url`

### 4. New SMS Template: `payroll_deadline_today`

Added to the `sms_templates` table:
- **Key:** `payroll_deadline_today`
- **Message:** `Reminder: Payroll for {{period_range}} is due today ({{deadline_date}}). Submit before end of day. {{action_url}}`
- **Variables:** `period_range`, `deadline_date`, `action_url`

### 5. New Email Templates (in-code, following existing pattern)

Two HTML email templates built into the edge function (same pattern as `send-daily-reminders`):

- **Deadline Day:** "Payroll submission due today" -- includes period dates, check date, and a CTA button to run payroll
- **Missed Deadline:** "URGENT: Payroll deadline missed" -- stronger language, red styling, same CTA

### 6. Notification Preference: `payroll_deadline_enabled`

A new column on `notification_preferences` so users can opt out of payroll deadline notifications if desired (default: true for users with payroll permission).

### 7. SMS Sender Utility

There is no shared SMS sending utility yet. A minimal `_shared/sms-sender.ts` will be created that uses the existing `sms_templates` table to resolve templates and a placeholder SMS provider integration. Since no SMS provider (Twilio, etc.) is connected yet, the function will log the message and can be wired to a provider later. This keeps the architecture ready without requiring a new API key right now.

---

## Technical Details

### PayrollDeadlineCard.tsx Changes

```
// New hook: usePayrollRunForPeriod(periodStart, periodEnd)
// Queries payroll_runs for a matching period with status in ('submitted','processed','completed')
// Returns { hasRun: boolean, isLoading: boolean }

// Visibility logic:
const daysUntilDeadline = differenceInDays(periodEndDate, now);
const hasSubmitted = payrollRun.hasRun;

if (hasSubmitted) return null; // payroll done, hide
if (daysUntilDeadline > 5) return null; // too early, hide

// Otherwise show with urgency styling based on daysUntilDeadline
```

### Edge Function: `check-payroll-deadline/index.ts`

- Queries all organizations with `organization_payroll_settings`
- For each, calculates current period end date
- Checks `payroll_runs` for a matching submitted run
- If deadline is today or passed without a run:
  - Finds users with `manage_payroll` permission (via `user_roles` + `effective_permissions`)
  - Sends email via Resend (using `_shared/email-sender.ts`)
  - Sends push notification (via `send-push-notification` invocation)
  - Sends SMS using template (logs for now until SMS provider is connected)

### Database Migration

1. Add `payroll_deadline_enabled` boolean column to `notification_preferences` (default `true`)
2. Insert two new SMS templates (`payroll_deadline_today`, `payroll_deadline_missed`)

### Cron Schedule

A `pg_cron` job to invoke `check-payroll-deadline` daily at 9:00 AM UTC.
