

## Native Payroll Run Functionality for Super Admins

This plan implements a complete payroll run wizard that allows super admins to natively run payroll from their dashboards, calculate employee compensation including commissions, and track payroll history - all without requiring a connected provider (Gusto/QuickBooks).

---

### Overview

The system will enable account owners and super admins to:
1. **Create payroll runs** with a step-by-step wizard
2. **Auto-calculate compensation** based on employee settings (hourly, salary, commission)
3. **Pull commission data** from existing Phorest sales data
4. **Review and approve** payroll before finalizing
5. **Save payroll runs** to the database for history and reporting
6. **Export payroll reports** for external processing

---

### Architecture

```text
+-------------------+       +-------------------+       +-------------------+
|  Run Payroll      |       | Local Database    |       | Phorest Sales     |
|  Wizard (UI)      | <---> | payroll_runs +    | <---- | Data (Commission  |
|                   |       | payroll_line_items|       | Calculation)      |
+-------------------+       +-------------------+       +-------------------+
```

Since API keys are not yet configured, the system will:
- Store payroll runs locally in the database
- Calculate all compensation based on `employee_payroll_settings`
- Pull commission data from `phorest_daily_sales_summary`
- Generate exportable reports for manual processing via external systems

---

### Changes Summary

| Area | Files | Action |
|------|-------|--------|
| Components | `RunPayrollWizard.tsx` | **Create** - Multi-step payroll wizard |
| Components | `PayPeriodStep.tsx` | **Create** - Date selection step |
| Components | `EmployeeHoursStep.tsx` | **Create** - Hours entry step |
| Components | `CommissionStep.tsx` | **Create** - Commission review step |
| Components | `ReviewStep.tsx` | **Create** - Final review before submission |
| Components | `PayrollSummaryCard.tsx` | **Create** - Summary statistics |
| Hooks | `usePayrollCalculations.ts` | **Create** - Compensation calculation logic |
| Hooks | `usePayroll.ts` | **Edit** - Add local payroll creation mutation |
| Pages | `Payroll.tsx` | **Edit** - Integrate wizard and add navigation link |
| DashboardLayout | `DashboardLayout.tsx` | **Edit** - Add Payroll nav item |

---

### Component Details

#### 1. `RunPayrollWizard.tsx` (New)

A multi-step wizard with the following flow:

**Step 1: Select Pay Period**
- Choose pay period start/end dates with date picker
- Select check date (when employees get paid)
- Display current pay schedule info

**Step 2: Enter Hours**
- List all active employees with payroll settings
- For hourly employees: Input regular hours and overtime hours
- For salaried employees: Show calculated period salary
- Skip option for commission-only employees

**Step 3: Review Commissions**
- Auto-fetch sales data from `phorest_daily_sales_summary` for the pay period
- Calculate commissions using `useCommissionTiers` hook
- Display breakdown by employee with service and product commissions
- Allow manual adjustments

**Step 4: Add Bonuses/Adjustments**
- Optional one-time bonuses per employee
- Tips entry if applicable
- Deductions or adjustments

**Step 5: Review and Submit**
- Display full summary with all employees
- Show gross pay, estimated taxes, net pay per employee
- Total payroll cost breakdown
- Confirm and save to database

#### 2. `usePayrollCalculations.ts` (New)

Centralized calculation logic:

```typescript
interface EmployeeCompensation {
  employeeId: string;
  regularHours: number;
  overtimeHours: number;
  hourlyPay: number;
  salaryPay: number;
  commissionPay: number;
  bonusPay: number;
  tips: number;
  grossPay: number;
  estimatedTaxes: number;
  estimatedDeductions: number;
  netPay: number;
}

function calculateEmployeeCompensation(
  settings: EmployeePayrollSettings,
  hours: { regular: number; overtime: number },
  salesData: SalesData[],
  bonus?: number,
  tips?: number
): EmployeeCompensation
```

**Calculation Rules:**
- **Hourly**: `(regularHours * hourlyRate) + (overtimeHours * hourlyRate * 1.5)`
- **Salary**: `(annualSalary / 52) * weeksInPeriod` or `/26` for bi-weekly
- **Commission**: Use existing `calculateCommission()` from `useCommissionTiers`
- **Tax Estimates**: Apply standard withholding percentages (federal ~22%, state ~5%, FICA 7.65%)

#### 3. Commission Integration

Fetch and aggregate sales data for the pay period:

```typescript
// Query phorest_daily_sales_summary for pay period
const { data: salesData } = useQuery({
  queryKey: ['payroll-sales', payPeriodStart, payPeriodEnd],
  queryFn: async () => {
    const { data } = await supabase
      .from('phorest_daily_sales_summary')
      .select('user_id, service_revenue, product_revenue, summary_date')
      .gte('summary_date', payPeriodStart)
      .lte('summary_date', payPeriodEnd);
    return data;
  }
});

// Aggregate by employee
const employeeSales = aggregateSalesByEmployee(salesData);

// Calculate commissions
employees.forEach(emp => {
  const sales = employeeSales[emp.employee_id];
  const commission = calculateCommission(sales.serviceRevenue, sales.productRevenue);
});
```

---

### Local Payroll Run Creation

Since providers are not connected, payroll runs will be saved locally:

```typescript
// usePayroll.ts - new mutation
const createLocalPayrollRun = useMutation({
  mutationFn: async (data: {
    payPeriodStart: string;
    payPeriodEnd: string;
    checkDate: string;
    lineItems: EmployeeCompensation[];
  }) => {
    // Calculate totals
    const totals = calculatePayrollTotals(data.lineItems);
    
    // Insert payroll run
    const { data: payrollRun, error: runError } = await supabase
      .from('payroll_runs')
      .insert({
        organization_id: organizationId,
        provider: connection?.provider || 'gusto', // default provider
        pay_period_start: data.payPeriodStart,
        pay_period_end: data.payPeriodEnd,
        check_date: data.checkDate,
        status: 'draft', // stays draft until provider is connected
        total_gross_pay: totals.grossPay,
        total_employer_taxes: totals.employerTaxes,
        total_employee_deductions: totals.deductions,
        total_net_pay: totals.netPay,
        employee_count: data.lineItems.length,
      })
      .select()
      .single();
    
    // Insert line items
    const lineItemsToInsert = data.lineItems.map(item => ({
      payroll_run_id: payrollRun.id,
      employee_id: item.employeeId,
      gross_pay: item.grossPay,
      regular_hours: item.regularHours,
      overtime_hours: item.overtimeHours,
      hourly_pay: item.hourlyPay,
      salary_pay: item.salaryPay,
      commission_pay: item.commissionPay,
      bonus_pay: item.bonusPay,
      tips: item.tips,
      employee_taxes: item.estimatedTaxes,
      net_pay: item.netPay,
    }));
    
    await supabase.from('payroll_line_items').insert(lineItemsToInsert);
    
    return payrollRun;
  },
});
```

---

### UI Flow and Wizard Steps

**Step Progress Indicator:**
```text
[1 Pay Period] ── [2 Hours] ── [3 Commissions] ── [4 Adjustments] ── [5 Review]
     ●              ○             ○                   ○                 ○
```

**Pay Period Step:**
- Calendar date pickers for start/end
- Presets: "Last 2 weeks", "Last month", "Current pay period"
- Check date defaults to 5 business days after period end

**Hours Entry Step:**
- Table with employee avatars, names, pay types
- Input fields for regular and overtime hours
- Running total of wages displayed
- Bulk actions: "Apply standard hours to all"

**Commission Step:**
- Auto-populated from Phorest sales data
- Tier progression visualization (same as existing `CommissionCalculator`)
- Manual override capability with change reason

**Review Step:**
- Full breakdown per employee in expandable rows
- Company totals: Gross, Taxes, Net
- Export button for CSV download
- "Save as Draft" and "Finalize Payroll" buttons

---

### Navigation Integration

Add Payroll to admin navigation in `DashboardLayout.tsx`:

```typescript
const adminOnlyNavItems: NavItem[] = [
  // ... existing items
  { 
    href: '/dashboard/admin/payroll', 
    label: 'Payroll', 
    icon: DollarSign, 
    permission: 'manage_payroll' 
  },
];
```

---

### Export Functionality

For organizations without provider connections, provide export options:

**CSV Export:**
- Employee Name, Hours, Gross Pay, Taxes, Deductions, Net Pay
- Suitable for import into external payroll systems

**PDF Summary:**
- Payroll run summary with company totals
- Individual employee breakdowns
- Signature lines for approval

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/dashboard/payroll/RunPayrollWizard.tsx` | **Create** | Main wizard component |
| `src/components/dashboard/payroll/steps/PayPeriodStep.tsx` | **Create** | Date selection step |
| `src/components/dashboard/payroll/steps/EmployeeHoursStep.tsx` | **Create** | Hours entry table |
| `src/components/dashboard/payroll/steps/CommissionStep.tsx` | **Create** | Commission review |
| `src/components/dashboard/payroll/steps/AdjustmentsStep.tsx` | **Create** | Bonuses and adjustments |
| `src/components/dashboard/payroll/steps/ReviewStep.tsx` | **Create** | Final review |
| `src/components/dashboard/payroll/PayrollSummaryCard.tsx` | **Create** | Summary stats display |
| `src/hooks/usePayrollCalculations.ts` | **Create** | Calculation logic |
| `src/hooks/usePayroll.ts` | **Edit** | Add local creation mutation |
| `src/pages/dashboard/admin/Payroll.tsx` | **Edit** | Integrate wizard |
| `src/components/dashboard/DashboardLayout.tsx` | **Edit** | Add nav item |

---

### Technical Notes

1. **Offline-First**: Payroll runs are stored locally first, then can be synced to providers when connected

2. **Tax Estimates**: Uses approximate withholding rates; actual taxes will be calculated by the provider when connected

3. **Commission Data**: Relies on synced Phorest data; warns if data appears stale

4. **Permissions**: Requires `manage_payroll` permission (granted to `super_admin` and `admin`)

5. **Draft Status**: Runs saved without a provider connection stay in "draft" status until submitted through a connected provider

6. **Animations**: Uses `framer-motion` for step transitions (consistent with existing wizard patterns)

