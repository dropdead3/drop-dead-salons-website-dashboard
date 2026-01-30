import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCommissionTiers } from './useCommissionTiers';
import { EmployeePayrollSettings, PayType } from './useEmployeePayrollSettings';

export interface EmployeeHours {
  employeeId: string;
  regularHours: number;
  overtimeHours: number;
}

export interface EmployeeAdjustments {
  employeeId: string;
  bonus: number;
  tips: number;
  deductions: number;
}

export interface EmployeeSalesData {
  employeeId: string;
  serviceRevenue: number;
  productRevenue: number;
}

export interface EmployeeCompensation {
  employeeId: string;
  employeeName: string;
  photoUrl: string | null;
  payType: PayType;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number | null;
  hourlyPay: number;
  salaryPay: number;
  commissionPay: number;
  serviceCommission: number;
  productCommission: number;
  bonusPay: number;
  tips: number;
  deductions: number;
  grossPay: number;
  estimatedFederalTax: number;
  estimatedStateTax: number;
  estimatedFICA: number;
  estimatedTaxes: number;
  employerTaxes: number;
  netPay: number;
}

export interface PayrollTotals {
  grossPay: number;
  totalHourlyPay: number;
  totalSalaryPay: number;
  totalCommissions: number;
  totalBonuses: number;
  totalTips: number;
  totalDeductions: number;
  employeeTaxes: number;
  employerTaxes: number;
  netPay: number;
  employeeCount: number;
}

// Tax rate constants (approximate withholding rates)
const TAX_RATES = {
  FEDERAL: 0.22, // 22% federal income tax withholding
  STATE: 0.05, // 5% state tax (varies by state)
  FICA_EMPLOYEE: 0.0765, // Social Security (6.2%) + Medicare (1.45%)
  FICA_EMPLOYER: 0.0765, // Employer's matching FICA
  FUTA: 0.006, // Federal Unemployment (0.6% after credit)
  SUTA: 0.027, // State Unemployment (varies, ~2.7% average)
};

export function usePayrollSalesData(
  payPeriodStart: string | null,
  payPeriodEnd: string | null,
  employeeIds: string[]
) {
  return useQuery({
    queryKey: ['payroll-sales-data', payPeriodStart, payPeriodEnd, employeeIds],
    queryFn: async () => {
      if (!payPeriodStart || !payPeriodEnd || employeeIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('phorest_daily_sales_summary')
        .select('user_id, service_revenue, product_revenue, summary_date')
        .gte('summary_date', payPeriodStart)
        .lte('summary_date', payPeriodEnd)
        .in('user_id', employeeIds);

      if (error) throw error;

      // Aggregate by employee
      const aggregated = (data || []).reduce((acc, row) => {
        if (!row.user_id) return acc;
        if (!acc[row.user_id]) {
          acc[row.user_id] = { serviceRevenue: 0, productRevenue: 0 };
        }
        acc[row.user_id].serviceRevenue += Number(row.service_revenue) || 0;
        acc[row.user_id].productRevenue += Number(row.product_revenue) || 0;
        return acc;
      }, {} as Record<string, { serviceRevenue: number; productRevenue: number }>);

      return Object.entries(aggregated).map(([employeeId, sales]) => ({
        employeeId,
        ...sales,
      }));
    },
    enabled: !!payPeriodStart && !!payPeriodEnd && employeeIds.length > 0,
  });
}

export function usePayrollCalculations() {
  const { calculateCommission, tiers } = useCommissionTiers();

  const calculateEmployeeCompensation = (
    settings: EmployeePayrollSettings,
    hours: EmployeeHours,
    salesData: EmployeeSalesData | undefined,
    adjustments: EmployeeAdjustments | undefined,
    weeksInPeriod: number = 2
  ): EmployeeCompensation => {
    const hourlyRate = settings.hourly_rate || 0;
    const annualSalary = settings.salary_amount || 0;
    const payType = settings.pay_type;

    // Calculate hourly pay
    let hourlyPay = 0;
    if (payType === 'hourly' || payType === 'hourly_plus_commission') {
      const regularPay = hours.regularHours * hourlyRate;
      const overtimePay = hours.overtimeHours * hourlyRate * 1.5;
      hourlyPay = regularPay + overtimePay;
    }

    // Calculate salary pay (bi-weekly = /26, weekly = /52)
    let salaryPay = 0;
    if (payType === 'salary' || payType === 'salary_plus_commission') {
      salaryPay = (annualSalary / 26) * (weeksInPeriod / 2);
    }

    // Calculate commission
    let commissionPay = 0;
    let serviceCommission = 0;
    let productCommission = 0;
    if (
      settings.commission_enabled &&
      salesData &&
      (payType === 'commission' ||
        payType === 'hourly_plus_commission' ||
        payType === 'salary_plus_commission')
    ) {
      const commission = calculateCommission(
        salesData.serviceRevenue,
        salesData.productRevenue
      );
      serviceCommission = commission.serviceCommission;
      productCommission = commission.productCommission;
      commissionPay = commission.totalCommission;
    }

    // Get adjustments
    const bonus = adjustments?.bonus || 0;
    const tips = adjustments?.tips || 0;
    const deductions = adjustments?.deductions || 0;

    // Calculate gross pay
    const grossPay = hourlyPay + salaryPay + commissionPay + bonus + tips;

    // Calculate taxes (estimates)
    const taxableIncome = grossPay; // Simplified - all gross is taxable
    const estimatedFederalTax = taxableIncome * TAX_RATES.FEDERAL;
    const estimatedStateTax = taxableIncome * TAX_RATES.STATE;
    const estimatedFICA = taxableIncome * TAX_RATES.FICA_EMPLOYEE;
    const estimatedTaxes = estimatedFederalTax + estimatedStateTax + estimatedFICA;

    // Employer taxes
    const employerTaxes =
      taxableIncome * TAX_RATES.FICA_EMPLOYER +
      taxableIncome * TAX_RATES.FUTA +
      taxableIncome * TAX_RATES.SUTA;

    // Net pay
    const netPay = grossPay - estimatedTaxes - deductions;

    return {
      employeeId: settings.employee_id,
      employeeName: settings.employee?.full_name || 'Unknown',
      photoUrl: settings.employee?.photo_url || null,
      payType,
      regularHours: hours.regularHours,
      overtimeHours: hours.overtimeHours,
      hourlyRate,
      hourlyPay,
      salaryPay,
      commissionPay,
      serviceCommission,
      productCommission,
      bonusPay: bonus,
      tips,
      deductions,
      grossPay,
      estimatedFederalTax,
      estimatedStateTax,
      estimatedFICA,
      estimatedTaxes,
      employerTaxes,
      netPay,
    };
  };

  const calculatePayrollTotals = (
    compensations: EmployeeCompensation[]
  ): PayrollTotals => {
    return compensations.reduce(
      (totals, comp) => ({
        grossPay: totals.grossPay + comp.grossPay,
        totalHourlyPay: totals.totalHourlyPay + comp.hourlyPay,
        totalSalaryPay: totals.totalSalaryPay + comp.salaryPay,
        totalCommissions: totals.totalCommissions + comp.commissionPay,
        totalBonuses: totals.totalBonuses + comp.bonusPay,
        totalTips: totals.totalTips + comp.tips,
        totalDeductions: totals.totalDeductions + comp.deductions,
        employeeTaxes: totals.employeeTaxes + comp.estimatedTaxes,
        employerTaxes: totals.employerTaxes + comp.employerTaxes,
        netPay: totals.netPay + comp.netPay,
        employeeCount: totals.employeeCount + 1,
      }),
      {
        grossPay: 0,
        totalHourlyPay: 0,
        totalSalaryPay: 0,
        totalCommissions: 0,
        totalBonuses: 0,
        totalTips: 0,
        totalDeductions: 0,
        employeeTaxes: 0,
        employerTaxes: 0,
        netPay: 0,
        employeeCount: 0,
      }
    );
  };

  const getWeeksInPeriod = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.round(diffDays / 7));
  };

  return {
    calculateEmployeeCompensation,
    calculatePayrollTotals,
    getWeeksInPeriod,
    commissionTiers: tiers,
  };
}
