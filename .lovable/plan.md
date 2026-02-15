

## Add Dismiss Button to "Pay Schedule Not Configured" Notification

The screenshot shows the "Pay schedule not configured" banner on the dashboard. You want to be able to close/dismiss it so it stops showing.

### What will change

A small **X button** will be added to the top-right corner of the "Pay schedule not configured" card. Clicking it will hide the card for the current user. The dismissal will be remembered using `localStorage` so it stays hidden across page refreshes and sessions.

### Technical details

**File: `src/components/dashboard/payroll/PayrollDeadlineCard.tsx`**
- Add a `useState` for `dismissed`, initialized from `localStorage` (key: `payroll-deadline-config-dismissed`)
- When `dismissed` is true and `!settings`, return `null`
- Add an `X` (close) icon button to the "not configured" card layout, positioned at the top-right
- On click, set `dismissed = true` and persist to `localStorage`

This approach keeps it simple -- no database changes needed. If you later configure your pay schedule, the card naturally won't show anyway (it only appears when `settings` is null).
