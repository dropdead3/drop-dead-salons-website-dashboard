

# Payroll Countdown and Payday Visibility

## What This Does

Two additions that bring payroll timing front-and-center for the people who need it:

1. **For payroll managers/bookkeepers (Command Center):** A "Payroll Submission Deadline" countdown card that shows exactly how many days/hours remain before payroll must be submitted for the current period. This uses the pay period end date from the configured pay schedule settings. It links directly to the Hiring & Payroll Hub so they can take action.

2. **For staff on payroll (My Pay page + employee profiles):** A "Countdown to Payday" display showing days until their next paycheck, along with their estimated payout amount. This surfaces on the My Pay dashboard's Current Period card and can also appear as a compact banner on the Command Center for any employee who has payroll settings configured.

---

## Detailed Changes

### 1. New Component: `PayrollDeadlineCard`
**File:** `src/components/dashboard/payroll/PayrollDeadlineCard.tsx`

A card for the Command Center visible only to users with `manage_payroll` permission. It will:
- Use `usePaySchedule()` to get the current pay period end date
- Display a `LiveCountdown` (in `days` mode) counting down to the period end date (the submission deadline)
- Show the period range (e.g., "Feb 1 - Feb 15") and the check date
- Include a "Run Payroll" link to `/dashboard/admin/payroll`
- Use `VisibilityGate` with a new element key `payroll_deadline_countdown`
- When no pay schedule is configured, show a prompt to configure it in settings

### 2. New Component: `PaydayCountdownBanner`
**File:** `src/components/dashboard/mypay/PaydayCountdownBanner.tsx`

A compact, calm banner for staff on payroll. It will:
- Use `useMyPayData()` to get the next check date and estimated net pay
- Display a `LiveCountdown` (in `days` mode) to the check date
- Show the estimated payout as a blurred amount (`BlurredAmount`)
- Render as a subtle card/banner, not attention-grabbing unless payday is within 3 days

### 3. Update: My Pay Page - `CurrentPeriodCard`
**File:** `src/components/dashboard/mypay/CurrentPeriodCard.tsx`

- Add a `LiveCountdown` to the check date at the top of the card showing "Payday in X days, Y hours"
- The countdown uses `days` display mode for a calm, non-urgent feel
- Pass the `checkDate` from `currentPeriod` to the countdown

### 4. Update: Command Center - `DashboardHome.tsx`
**File:** `src/pages/dashboard/DashboardHome.tsx`

- Import `PayrollDeadlineCard` and `PaydayCountdownBanner`
- Add `PayrollDeadlineCard` to the `sectionComponents` map, gated behind `manage_payroll` permission check (using `roles` array to check for leadership/bookkeeper)
- Add `PaydayCountdownBanner` as a small section visible to any authenticated user who has payroll settings (the component self-hides if no settings exist)
- Both integrate into the existing layout system as new section keys

### 5. Register New Dashboard Elements
The new element keys (`payroll_deadline_countdown`, `payday_countdown_banner`) will need visibility entries. These can be added via the existing `CommandCenterContent` patterns or auto-registered.

---

## Technical Notes

- **No new database tables or migrations needed.** All data comes from existing `organization_payroll_settings` and `employee_payroll_settings` tables.
- **`LiveCountdown` reuse:** The existing component supports `days` display mode which is perfect for multi-day countdowns (shows "5d 12h" format).
- **Permission gating:** `PayrollDeadlineCard` checks for `manage_payroll` via role membership (same pattern as `HubQuickLinks`). `PaydayCountdownBanner` is self-gating -- it queries the user's own payroll settings and renders nothing if none exist.
- **UX alignment with Zura principles:** The payday countdown is calm and informational. The payroll deadline countdown becomes urgent (red) only when the deadline is within 24 hours. Otherwise it is quiet and confident.

