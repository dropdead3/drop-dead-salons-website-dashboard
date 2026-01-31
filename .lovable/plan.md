
## My Pay Feature - Personal Earnings Dashboard for Team Members

This plan creates a dedicated "My Pay" experience where team members can view their earnings, track estimated compensation through the current pay period, and access pay stubs from finalized payroll runs.

---

### Feature Overview

Team members will be able to:
1. **View current period estimated earnings** - Real-time calculation based on hours worked and sales data from Phorest
2. **See earnings breakdown** - Base pay (hourly/salary), commissions, bonuses, tips
3. **Track commission progress** - Leverage existing tier visualization components
4. **Access pay stub history** - View and download finalized payroll records
5. **Understand tax withholdings** - See estimated deductions

---

### Implementation Approach

Based on my analysis, I recommend **creating a dedicated `/dashboard/my-pay` page** rather than adding a tab to MyProfile. This approach:
- Keeps MyProfile focused on contact/schedule information
- Follows the existing pattern of "My" pages (My Graduation, My Handbooks, My Stats)
- Provides more space for earnings visualizations and history tables
- Allows permission-gated access via `view_my_pay` permission

---

### Architecture

```text
+-----------------------+       +-------------------------+
|   My Pay Page         | <---> | useMyPayData Hook       |
|   (Employee View)     |       | - Current period calcs  |
+-----------------------+       | - Personal pay stubs    |
         |                      +-------------------------+
         |                               |
         v                               v
+------------------+           +-------------------+
| Reused Components|           | Database Tables   |
| - CommissionCalc |           | - payroll_runs    |
| - TierProgress   |           | - payroll_line_items
| - BlurredAmount  |           | - employee_payroll_settings
+------------------+           | - phorest_daily_sales_summary
                               +-------------------+
```

---

### UI Design

**Page Structure:**

```text
+------------------------------------------------------------+
|  MY PAY                                                     |
|  Your earnings and pay history                             |
+------------------------------------------------------------+
|                                                            |
|  [Current Period] [Pay History]                            |
|                                                            |
|  +------------------------+  +---------------------------+ |
|  | CURRENT PERIOD         |  | ESTIMATED COMMISSION      | |
|  | Jan 15 - Jan 31        |  | Based on your sales       | |
|  |                        |  |                           | |
|  | Base Pay    $1,200     |  |    $847 (estimated)       | |
|  | Commission   $847*     |  |    [Tier: Silver - 42%]   | |
|  | -------------------    |  |                           | |
|  | Est. Gross  $2,047     |  | [====>----] $653 to Gold  | |
|  | Est. Taxes   ~$673     |  |                           | |
|  | -------------------    |  +---------------------------+ |
|  | Est. Net   ~$1,374     |                                |
|  +------------------------+                                |
|                                                            |
|  +-------------------------------------------------------+ |
|  | EARNINGS BREAKDOWN                                    | |
|  | +-------------+-------------+-------------+           | |
|  | | Base Pay    | Commission  | Tips/Bonus  |           | |
|  | | $1,200      | $847        | $0          |           | |
|  | +-------------+-------------+-------------+           | |
|  +-------------------------------------------------------+ |
+------------------------------------------------------------+

[Pay History Tab]
+------------------------------------------------------------+
|  PAY HISTORY                                               |
|                                                            |
|  +-------------------------------------------------------+ |
|  | Check Date  | Period          | Gross  | Net   | [>]  | |
|  |-------------|-----------------|--------|-------|------| |
|  | Jan 15      | Jan 1 - Jan 14  | $1,892 | $1,240| View | |
|  | Jan 1       | Dec 18 - Dec 31 | $2,104 | $1,378| View | |
|  | Dec 18      | Dec 4 - Dec 17  | $1,756 | $1,150| View | |
|  +-------------------------------------------------------+ |
|                                                            |
|  No pay stub selected                                      |
|  Click "View" to see details                               |
+------------------------------------------------------------+
```

---

### Component Structure

| Component | Purpose |
|-----------|---------|
| `MyPay.tsx` | Main page with two tabs: Current Period and Pay History |
| `CurrentPeriodCard.tsx` | Shows estimated earnings for active pay period |
| `EarningsBreakdownCard.tsx` | Visual breakdown of base, commission, tips |
| `MyPayStubHistory.tsx` | Table of finalized pay stubs for this employee |
| `PayStubDetailDialog.tsx` | Modal showing full breakdown when viewing a pay stub |

---

### Data Layer

**New Hook: `useMyPayData.ts`**

This hook provides:
1. **Current employee payroll settings** - Filtered to current user from `employee_payroll_settings`
2. **Current period sales data** - From `phorest_daily_sales_summary` for the active pay period
3. **Estimated compensation** - Uses `usePayrollCalculations` logic
4. **Pay stub history** - Query `payroll_line_items` joined with `payroll_runs` filtered by `employee_id = auth.uid()`

```typescript
interface MyPayData {
  settings: EmployeePayrollSettings | null;
  currentPeriod: {
    startDate: string;
    endDate: string;
    checkDate: string;
  };
  salesData: {
    serviceRevenue: number;
    productRevenue: number;
  };
  estimatedCompensation: EmployeeCompensation | null;
  payStubs: PayStub[];
  isLoading: boolean;
}

interface PayStub {
  id: string;
  payrollRunId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  checkDate: string;
  status: string;
  grossPay: number;
  regularHours: number;
  overtimeHours: number;
  hourlyPay: number;
  salaryPay: number;
  commissionPay: number;
  bonusPay: number;
  tips: number;
  taxes: number;
  deductions: number;
  netPay: number;
}
```

---

### Database Considerations

**RLS Policy Update Needed:**

Currently, `payroll_line_items` may only be readable by org admins. We need to add a policy allowing employees to read their own records:

```sql
CREATE POLICY "Employees can view their own pay stubs"
ON public.payroll_line_items FOR SELECT
USING (employee_id = auth.uid());
```

Similarly for `employee_payroll_settings`:

```sql
CREATE POLICY "Employees can view their own payroll settings"
ON public.employee_payroll_settings FOR SELECT
USING (employee_id = auth.uid());
```

---

### Permission & Navigation

**New Permission:**
- `view_my_pay` - Allows access to the My Pay page

**Navigation Integration:**
Add to `DashboardLayout.tsx` in a new "My Money" or existing section:

```typescript
{ 
  href: '/dashboard/my-pay', 
  label: 'My Pay', 
  icon: Wallet, 
  permission: 'view_my_pay' 
}
```

**Sidebar Route Config:**
Add to `SidebarLayoutEditor.tsx`:

```typescript
'/dashboard/my-pay': { label: 'My Pay', icon: Wallet },
```

---

### UI Component Reuse

The following existing components can be reused or adapted:
- `CommissionCalculator` - For displaying estimated commission with tier info
- `TierProgressAlert` - For showing progress to next commission tier
- `BlurredAmount` - For privacy mode compatibility
- `PayrollHistoryTable` pattern - Adapted for single-employee view
- Card patterns from `Stats.tsx` - For current period summary

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/dashboard/MyPay.tsx` | **Create** | Main page with tabs |
| `src/components/dashboard/mypay/CurrentPeriodCard.tsx` | **Create** | Estimated earnings display |
| `src/components/dashboard/mypay/EarningsBreakdownCard.tsx` | **Create** | Visual earnings breakdown |
| `src/components/dashboard/mypay/MyPayStubHistory.tsx` | **Create** | Personal pay stub table |
| `src/components/dashboard/mypay/PayStubDetailDialog.tsx` | **Create** | Pay stub detail modal |
| `src/hooks/useMyPayData.ts` | **Create** | Personal pay data hook |
| `src/App.tsx` | **Edit** | Add route for `/dashboard/my-pay` |
| `src/components/dashboard/DashboardLayout.tsx` | **Edit** | Add nav item |
| `src/components/dashboard/settings/SidebarLayoutEditor.tsx` | **Edit** | Register route |
| Database migration | **Create** | Add RLS policies + permission |

---

### Privacy Considerations

- All monetary values wrapped in `BlurredAmount` for "Hide Numbers" mode
- Employees can ONLY see their own data (enforced via RLS)
- Pay settings (hourly rate, salary) are shown to the employee but not to other team members
- Estimated taxes are clearly labeled as "estimates" since actual withholdings may differ

---

### Technical Notes

1. **Pay Period Detection**: Will infer current pay period from most recent finalized payroll run or default to bi-weekly from today

2. **Real-time Estimates**: Uses live Phorest sales data to show up-to-the-minute commission estimates

3. **No Hours Entry**: For the estimated view, we'll assume standard hours or skip hourly estimates if no hours are tracked yet

4. **Commission-Only View**: For commission-only employees, the base pay section will be minimal/hidden

5. **Export Option**: Pay stubs can be downloaded as PDF (future enhancement)

6. **Mobile Responsive**: Cards stack vertically on mobile with touch-friendly interactions

---

### Suggested Enhancements (Future)

- **Direct Deposit Setup**: Link to bank account verification flow when provider is connected
- **YTD Earnings**: Running total for the calendar year
- **W-2/Tax Documents**: Access to year-end tax forms (when provider connected)
- **Pay Schedule Calendar**: Visual calendar showing upcoming pay dates
- **Earnings Comparison**: Month-over-month or year-over-year trends
