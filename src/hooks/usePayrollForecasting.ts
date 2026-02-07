import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useEmployeePayrollSettings } from './useEmployeePayrollSettings';
import { usePaySchedule, getCurrentPayPeriod } from './usePaySchedule';
import { useCommissionTiers } from './useCommissionTiers';
import { format, differenceInDays, subDays } from 'date-fns';

export interface EmployeeProjection {
  employeeId: string;
  employeeName: string;
  photoUrl: string | null;
  payType: string;
  
  currentPeriodSales: {
    services: number;
    products: number;
  };
  
  projectedSales: {
    services: number;
    products: number;
  };
  
  currentTier: {
    name: string;
    rate: number;
  } | null;
  
  nextTier: {
    name: string;
    rate: number;
    threshold: number;
  } | null;
  
  tierProgress: number; // 0-100
  amountToNextTier: number;
  
  projectedCompensation: {
    basePay: number;
    serviceCommission: number;
    productCommission: number;
    totalGross: number;
  };
}

export interface PayrollProjection {
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  checkDate: string;
  
  // Projected values
  projectedGrossPay: number;
  projectedCommissions: number;
  projectedTaxes: number;
  projectedNetPay: number;
  projectedTips: number;
  
  // Breakdown
  byEmployee: EmployeeProjection[];
  
  // Confidence metrics
  confidenceLevel: 'high' | 'medium' | 'low';
  daysOfData: number;
  daysRemaining: number;
  
  // Comparison
  vsLastPeriod: number; // percentage change
}

export function usePayrollForecasting() {
  const { selectedOrganization } = useOrganizationContext();
  const organizationId = selectedOrganization?.id;
  const { employeeSettings, isLoading: isLoadingSettings } = useEmployeePayrollSettings();
  const { settings: paySchedule, isLoading: isLoadingSchedule } = usePaySchedule();
  const { tiers, isLoading: isLoadingTiers } = useCommissionTiers();

  // Get current pay period
  const currentPeriod = paySchedule ? getCurrentPayPeriod(paySchedule) : null;
  const periodStart = currentPeriod ? format(currentPeriod.periodStart, 'yyyy-MM-dd') : null;
  const periodEnd = currentPeriod ? format(currentPeriod.periodEnd, 'yyyy-MM-dd') : null;

  // Fetch current period sales data
  const { data: currentSalesData, isLoading: isLoadingSales } = useQuery({
    queryKey: ['payroll-forecast-sales', periodStart, periodEnd],
    queryFn: async () => {
      if (!periodStart || !periodEnd) return [];

      const { data, error } = await supabase
        .from('phorest_daily_sales_summary')
        .select('user_id, service_revenue, product_revenue, summary_date')
        .gte('summary_date', periodStart)
        .lte('summary_date', periodEnd);

      if (error) throw error;
      return data || [];
    },
    enabled: !!periodStart && !!periodEnd,
  });

  // Fetch last period for comparison
  const lastPeriodEnd = currentPeriod ? format(subDays(currentPeriod.periodStart, 1), 'yyyy-MM-dd') : null;
  const lastPeriodStart = currentPeriod && paySchedule
    ? format(subDays(currentPeriod.periodStart, differenceInDays(currentPeriod.periodEnd, currentPeriod.periodStart) + 1), 'yyyy-MM-dd')
    : null;

  const { data: lastPeriodSales } = useQuery({
    queryKey: ['payroll-forecast-last-period-sales', lastPeriodStart, lastPeriodEnd],
    queryFn: async () => {
      if (!lastPeriodStart || !lastPeriodEnd) return [];

      const { data, error } = await supabase
        .from('phorest_daily_sales_summary')
        .select('user_id, service_revenue, product_revenue')
        .gte('summary_date', lastPeriodStart)
        .lte('summary_date', lastPeriodEnd);

      if (error) throw error;
      return data || [];
    },
    enabled: !!lastPeriodStart && !!lastPeriodEnd,
  });

  // Calculate projections
  const projection = useMemo<PayrollProjection | null>(() => {
    if (!currentPeriod || !periodStart || !periodEnd) return null;

    const activeEmployees = employeeSettings.filter(e => e.is_payroll_active);
    if (activeEmployees.length === 0) return null;

    const today = new Date();
    const daysPassed = Math.max(1, differenceInDays(today, currentPeriod.periodStart) + 1);
    const totalDays = differenceInDays(currentPeriod.periodEnd, currentPeriod.periodStart) + 1;
    const daysRemaining = Math.max(0, totalDays - daysPassed);

    // Aggregate current sales by employee
    const employeeSales: Record<string, { services: number; products: number }> = {};
    
    for (const row of currentSalesData || []) {
      if (!row.user_id) continue;
      if (!employeeSales[row.user_id]) {
        employeeSales[row.user_id] = { services: 0, products: 0 };
      }
      employeeSales[row.user_id].services += Number(row.service_revenue) || 0;
      employeeSales[row.user_id].products += Number(row.product_revenue) || 0;
    }

    // Calculate last period totals for comparison
    const lastPeriodTotal = (lastPeriodSales || []).reduce((sum, row) => 
      sum + (Number(row.service_revenue) || 0) + (Number(row.product_revenue) || 0), 0);

    // Build employee projections
    const employeeProjections: EmployeeProjection[] = activeEmployees.map(emp => {
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

      // Find current tier and next tier for services
      const serviceTiers = tiers
        .filter(t => t.applies_to === 'services' || t.applies_to === 'all')
        .sort((a, b) => a.min_revenue - b.min_revenue);

      let currentTier: { name: string; rate: number } | null = null;
      let nextTier: { name: string; rate: number; threshold: number } | null = null;
      let tierProgress = 0;
      let amountToNextTier = 0;

      for (let i = 0; i < serviceTiers.length; i++) {
        const tier = serviceTiers[i];
        const maxRev = tier.max_revenue ?? Infinity;
        
        if (projectedServices >= tier.min_revenue && projectedServices <= maxRev) {
          currentTier = { name: tier.tier_name, rate: tier.commission_rate };
          
          // Check for next tier
          if (i < serviceTiers.length - 1) {
            const next = serviceTiers[i + 1];
            nextTier = { name: next.tier_name, rate: next.commission_rate, threshold: next.min_revenue };
            amountToNextTier = next.min_revenue - projectedServices;
            tierProgress = tier.max_revenue 
              ? ((projectedServices - tier.min_revenue) / (tier.max_revenue - tier.min_revenue)) * 100
              : 0;
          } else {
            tierProgress = 100;
          }
          break;
        }
      }

      // Calculate commissions
      let serviceCommission = 0;
      let productCommission = 0;

      if (emp.commission_enabled) {
        if (currentTier) {
          serviceCommission = projectedServices * currentTier.rate;
        }
        
        // Find product tier
        const productTier = tiers.find(t =>
          (t.applies_to === 'products' || t.applies_to === 'all') &&
          projectedProducts >= t.min_revenue &&
          (t.max_revenue === null || projectedProducts <= t.max_revenue)
        );

        if (productTier) {
          productCommission = projectedProducts * productTier.commission_rate;
        }
      }

      return {
        employeeId: emp.employee_id,
        employeeName: emp.employee?.display_name || emp.employee?.full_name || 'Unknown',
        photoUrl: emp.employee?.photo_url || null,
        payType: emp.pay_type,
        currentPeriodSales: sales,
        projectedSales: { services: projectedServices, products: projectedProducts },
        currentTier,
        nextTier,
        tierProgress,
        amountToNextTier,
        projectedCompensation: {
          basePay,
          serviceCommission,
          productCommission,
          totalGross: basePay + serviceCommission + productCommission,
        },
      };
    });

    // Aggregate totals
    const projectedGrossPay = employeeProjections.reduce((sum, e) => sum + e.projectedCompensation.totalGross, 0);
    const projectedCommissions = employeeProjections.reduce((sum, e) => 
      sum + e.projectedCompensation.serviceCommission + e.projectedCompensation.productCommission, 0);
    const projectedTips = 0; // Tips removed from calculation as column doesn't exist
    
    // Estimate taxes (simplified)
    const projectedTaxes = projectedGrossPay * 0.35; // ~35% total tax burden
    const projectedNetPay = projectedGrossPay - projectedTaxes;

    // Determine confidence level
    let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
    if (daysPassed >= totalDays * 0.75) confidenceLevel = 'high';
    else if (daysPassed >= totalDays * 0.4) confidenceLevel = 'medium';

    // Calculate vs last period
    const vsLastPeriod = lastPeriodTotal > 0 
      ? ((projectedGrossPay - lastPeriodTotal) / lastPeriodTotal) * 100 
      : 0;

    return {
      periodLabel: `${format(currentPeriod.periodStart, 'MMM d')} - ${format(currentPeriod.periodEnd, 'MMM d')}`,
      periodStart,
      periodEnd,
      checkDate: format(currentPeriod.nextPayDay, 'yyyy-MM-dd'),
      projectedGrossPay,
      projectedCommissions,
      projectedTaxes,
      projectedNetPay,
      projectedTips,
      byEmployee: employeeProjections,
      confidenceLevel,
      daysOfData: daysPassed,
      daysRemaining,
      vsLastPeriod,
    };
  }, [currentPeriod, periodStart, periodEnd, employeeSettings, currentSalesData, lastPeriodSales, tiers]);

  const isLoading = isLoadingSettings || isLoadingSchedule || isLoadingTiers || isLoadingSales;

  return {
    projection,
    isLoading,
    currentPeriod,
  };
}
