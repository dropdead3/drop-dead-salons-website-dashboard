import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useEmployeePayrollSettings } from './useEmployeePayrollSettings';
import { usePayroll } from './usePayroll';
import { usePaySchedule, getCurrentPayPeriod } from './usePaySchedule';
import { useCommissionTiers } from './useCommissionTiers';
import { format, startOfYear, differenceInDays } from 'date-fns';

export interface PayrollKPIs {
  nextPayrollForecast: number;
  forecastChange: number; // % change vs last period
  ytdPayrollTotal: number;
  laborCostRatio: number; // % of revenue
  commissionRatio: number; // % of gross pay
  employerTaxBurden: number;
  activeEmployeeCount: number;
  overtimeHours: number;
  tipsCollected: number;
}

export interface CompensationBreakdown {
  basePay: number;
  serviceCommissions: number;
  productCommissions: number;
  bonuses: number;
  tips: number;
}

export interface PayrollAnalyticsData {
  kpis: PayrollKPIs;
  compensationBreakdown: CompensationBreakdown;
  isLoading: boolean;
  error: Error | null;
}

export function usePayrollAnalytics(): PayrollAnalyticsData {
  const { selectedOrganization } = useOrganizationContext();
  const organizationId = selectedOrganization?.id;
  const { employeeSettings, isLoading: isLoadingSettings } = useEmployeePayrollSettings();
  const { payrollRuns, isLoadingRuns } = usePayroll();
  const { settings: paySchedule, isLoading: isLoadingSchedule } = usePaySchedule();
  const { tiers } = useCommissionTiers();

  // Get current pay period
  const currentPeriod = paySchedule ? getCurrentPayPeriod(paySchedule) : null;
  const periodStart = currentPeriod ? format(currentPeriod.periodStart, 'yyyy-MM-dd') : null;
  const periodEnd = currentPeriod ? format(currentPeriod.periodEnd, 'yyyy-MM-dd') : null;

  // Fetch current period sales data for forecasting
  const { data: salesData, isLoading: isLoadingSales } = useQuery({
    queryKey: ['payroll-analytics-sales', periodStart, periodEnd, organizationId],
    queryFn: async () => {
      if (!periodStart || !periodEnd) return null;

      const { data, error } = await supabase
        .from('phorest_daily_sales_summary')
        .select('user_id, service_revenue, product_revenue, summary_date')
        .gte('summary_date', periodStart)
        .lte('summary_date', periodEnd);

      if (error) throw error;
      return data;
    },
    enabled: !!periodStart && !!periodEnd,
  });

  // Fetch YTD revenue for labor cost ratio
  const { data: ytdRevenue } = useQuery({
    queryKey: ['payroll-analytics-ytd-revenue', organizationId],
    queryFn: async () => {
      const yearStart = format(startOfYear(new Date()), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('phorest_daily_sales_summary')
        .select('service_revenue, product_revenue')
        .gte('summary_date', yearStart)
        .lte('summary_date', today);

      if (error) throw error;
      
      return data?.reduce((sum, row) => 
        sum + (Number(row.service_revenue) || 0) + (Number(row.product_revenue) || 0), 0) || 0;
    },
    enabled: !!organizationId,
  });

  // Calculate KPIs
  const kpis = calculateKPIs(
    employeeSettings,
    payrollRuns,
    salesData || [],
    ytdRevenue || 0,
    currentPeriod,
    tiers
  );

  // Calculate compensation breakdown from last completed payroll
  const compensationBreakdown = calculateCompensationBreakdown(payrollRuns);

  const isLoading = isLoadingSettings || isLoadingRuns || isLoadingSchedule || isLoadingSales;

  return {
    kpis,
    compensationBreakdown,
    isLoading,
    error: null,
  };
}

function calculateKPIs(
  employeeSettings: any[],
  payrollRuns: any[],
  salesData: any[],
  ytdRevenue: number,
  currentPeriod: { periodStart: Date; periodEnd: Date; nextPayDay: Date } | null,
  tiers: any[]
): PayrollKPIs {
  const activeEmployees = employeeSettings.filter(e => e.is_payroll_active);
  const activeEmployeeCount = activeEmployees.length;

  // Calculate YTD payroll from completed runs
  const ytdPayrollTotal = payrollRuns
    .filter(run => run.status === 'processed')
    .reduce((sum, run) => sum + (run.total_gross_pay || 0), 0);

  // Calculate labor cost ratio
  const laborCostRatio = ytdRevenue > 0 ? (ytdPayrollTotal / ytdRevenue) * 100 : 0;

  // Calculate forecast based on current period sales
  const { forecast, tipsCollected } = calculateForecast(
    salesData,
    activeEmployees,
    currentPeriod,
    tiers
  );

  // Get last period for comparison
  const lastRun = payrollRuns.find(run => run.status === 'processed');
  const forecastChange = lastRun?.total_gross_pay
    ? ((forecast - lastRun.total_gross_pay) / lastRun.total_gross_pay) * 100
    : 0;

  // Calculate commission ratio from last run
  const commissionRatio = lastRun?.total_gross_pay 
    ? ((lastRun.total_commissions || 0) / lastRun.total_gross_pay) * 100
    : 0;

  // Employer tax burden estimate (FICA + FUTA + SUTA ≈ 10%)
  const employerTaxBurden = forecast * 0.10;

  // Overtime hours (placeholder - would need time tracking integration)
  const overtimeHours = 0;

  return {
    nextPayrollForecast: forecast,
    forecastChange,
    ytdPayrollTotal,
    laborCostRatio,
    commissionRatio,
    employerTaxBurden,
    activeEmployeeCount,
    overtimeHours,
    tipsCollected,
  };
}

function calculateForecast(
  salesData: any[],
  employees: any[],
  currentPeriod: { periodStart: Date; periodEnd: Date; nextPayDay: Date } | null,
  tiers: any[]
): { forecast: number; tipsCollected: number } {
  if (!currentPeriod || employees.length === 0) {
    return { forecast: 0, tipsCollected: 0 };
  }

  const today = new Date();
  const daysPassed = Math.max(1, differenceInDays(today, currentPeriod.periodStart) + 1);
  const totalDays = differenceInDays(currentPeriod.periodEnd, currentPeriod.periodStart) + 1;
  const daysRemaining = Math.max(0, totalDays - daysPassed);

  // Aggregate current sales by employee
  const employeeSales: Record<string, { services: number; products: number }> = {};
  
  for (const row of salesData) {
    if (!row.user_id) continue;
    if (!employeeSales[row.user_id]) {
      employeeSales[row.user_id] = { services: 0, products: 0 };
    }
    employeeSales[row.user_id].services += Number(row.service_revenue) || 0;
    employeeSales[row.user_id].products += Number(row.product_revenue) || 0;
  }

  let totalForecast = 0;
  let totalTips = 0; // Keep for interface compatibility

  for (const emp of employees) {
    const sales = employeeSales[emp.employee_id] || { services: 0, products: 0 };
    
    // Project sales to end of period
    const dailyAvgServices = sales.services / daysPassed;
    const dailyAvgProducts = sales.products / daysPassed;
    const projectedServices = sales.services + (dailyAvgServices * daysRemaining);
    const projectedProducts = sales.products + (dailyAvgProducts * daysRemaining);

    // Calculate base pay
    let basePay = 0;
    const hoursPerPeriod = 80; // Assume 80 hours bi-weekly
    
    if (emp.pay_type === 'hourly' || emp.pay_type === 'hourly_plus_commission') {
      basePay = (emp.hourly_rate || 0) * hoursPerPeriod;
    } else if (emp.pay_type === 'salary' || emp.pay_type === 'salary_plus_commission') {
      basePay = (emp.salary_amount || 0) / 26; // Bi-weekly
    }

    // Calculate commission if enabled
    let commissionPay = 0;
    if (emp.commission_enabled) {
      // Find applicable tier for services
      const serviceTier = tiers.find(t => 
        (t.applies_to === 'services' || t.applies_to === 'all') &&
        projectedServices >= t.min_revenue &&
        (t.max_revenue === null || projectedServices <= t.max_revenue)
      );
      
      // Find applicable tier for products
      const productTier = tiers.find(t =>
        (t.applies_to === 'products' || t.applies_to === 'all') &&
        projectedProducts >= t.min_revenue &&
        (t.max_revenue === null || projectedProducts <= t.max_revenue)
      );

      if (serviceTier) {
        commissionPay += projectedServices * serviceTier.commission_rate;
      }
      if (productTier) {
        commissionPay += projectedProducts * productTier.commission_rate;
      }
    }

    totalForecast += basePay + commissionPay;
    // Tips not available in phorest_daily_sales_summary
  }

  return { forecast: totalForecast, tipsCollected: totalTips };
}

function calculateCompensationBreakdown(payrollRuns: any[]): CompensationBreakdown {
  // Get totals from last few processed runs
  const processedRuns = payrollRuns
    .filter(run => run.status === 'processed')
    .slice(0, 6);

  if (processedRuns.length === 0) {
    return {
      basePay: 0,
      serviceCommissions: 0,
      productCommissions: 0,
      bonuses: 0,
      tips: 0,
    };
  }

  // Aggregate from runs (these fields may need to be added to payroll_runs)
  const totals = processedRuns.reduce((acc, run) => ({
    basePay: acc.basePay + (run.total_base_pay || run.total_gross_pay * 0.55 || 0),
    serviceCommissions: acc.serviceCommissions + (run.total_service_commissions || run.total_commissions * 0.8 || 0),
    productCommissions: acc.productCommissions + (run.total_product_commissions || run.total_commissions * 0.2 || 0),
    bonuses: acc.bonuses + (run.total_bonuses || 0),
    tips: acc.tips + (run.total_tips || 0),
  }), {
    basePay: 0,
    serviceCommissions: 0,
    productCommissions: 0,
    bonuses: 0,
    tips: 0,
  });

  return totals;
}
