
# Move "Hire" Tab to the Right Side of the Tab Bar

## Change
Reorder the tabs in `src/pages/dashboard/admin/Payroll.tsx` so that **Hire** appears at the far right of the tab list instead of the far left. The current order is:

`Hire | Overview | Run Payroll | History | Team | Commissions | Settings`

The new order will be:

`Overview | Run Payroll | History | Team | Commissions | Settings | Hire`

## Technical Detail

**File: `src/pages/dashboard/admin/Payroll.tsx` (lines 90-118)**

Move the `<TabsTrigger value="hire">` block (lines 91-94) to after the Settings trigger (after line 118), making it the last tab in the list.
