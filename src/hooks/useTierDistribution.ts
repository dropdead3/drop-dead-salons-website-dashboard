import { useMemo } from 'react';
import { usePayrollForecasting, EmployeeProjection } from './usePayrollForecasting';
import { useCommissionTiers } from './useCommissionTiers';

export interface TierDistributionItem {
  tierName: string;
  tierRate: number;
  stylistCount: number;
  totalRevenue: number;
  employees: Array<{
    id: string;
    name: string;
    photoUrl: string | null;
    revenue: number;
    progress: number;
  }>;
}

export interface TierProgressionOpportunity {
  employeeId: string;
  employeeName: string;
  photoUrl: string | null;
  currentTier: string;
  nextTier: string;
  amountNeeded: number;
  progressPercent: number;
  rateIncrease: number;
}

export interface CommissionImpactAnalysis {
  currentPeriodCommissions: number;
  potentialAdditional: number;
  potentialIncreasePercent: number;
  revenueNeeded: number;
}

export interface TierDistributionData {
  distribution: TierDistributionItem[];
  progressionOpportunities: TierProgressionOpportunity[];
  impactAnalysis: CommissionImpactAnalysis;
  isLoading: boolean;
}

export function useTierDistribution(): TierDistributionData {
  const { projection, isLoading } = usePayrollForecasting();
  const { tiers } = useCommissionTiers();

  const result = useMemo(() => {
    if (!projection || projection.byEmployee.length === 0) {
      return {
        distribution: [],
        progressionOpportunities: [],
        impactAnalysis: {
          currentPeriodCommissions: 0,
          potentialAdditional: 0,
          potentialIncreasePercent: 0,
          revenueNeeded: 0,
        },
      };
    }

    // Build tier distribution
    const tierMap = new Map<string, TierDistributionItem>();
    
    // Initialize with all service tiers
    const serviceTiers = tiers.filter(t => t.applies_to === 'services' || t.applies_to === 'all');
    serviceTiers.forEach(tier => {
      tierMap.set(tier.tier_name, {
        tierName: tier.tier_name,
        tierRate: tier.commission_rate,
        stylistCount: 0,
        totalRevenue: 0,
        employees: [],
      });
    });

    // Add employees to their tiers
    const progressionOpportunities: TierProgressionOpportunity[] = [];
    let currentPeriodCommissions = 0;
    let potentialAdditional = 0;
    let revenueNeeded = 0;

    projection.byEmployee.forEach(emp => {
      if (!emp.currentTier) return;

      const tierItem = tierMap.get(emp.currentTier.name);
      if (tierItem) {
        tierItem.stylistCount++;
        tierItem.totalRevenue += emp.projectedSales.services;
        tierItem.employees.push({
          id: emp.employeeId,
          name: emp.employeeName,
          photoUrl: emp.photoUrl,
          revenue: emp.projectedSales.services,
          progress: emp.tierProgress,
        });
      }

      // Track commissions
      currentPeriodCommissions += emp.projectedCompensation.serviceCommission + emp.projectedCompensation.productCommission;

      // Check for progression opportunities (within 25% of next tier)
      if (emp.nextTier && emp.tierProgress >= 75) {
        const rateIncrease = emp.nextTier.rate - emp.currentTier.rate;
        
        progressionOpportunities.push({
          employeeId: emp.employeeId,
          employeeName: emp.employeeName,
          photoUrl: emp.photoUrl,
          currentTier: emp.currentTier.name,
          nextTier: emp.nextTier.name,
          amountNeeded: emp.amountToNextTier,
          progressPercent: emp.tierProgress,
          rateIncrease,
        });

        // Calculate potential additional if they hit next tier
        potentialAdditional += emp.projectedSales.services * rateIncrease;
        revenueNeeded += emp.amountToNextTier;
      }
    });

    // Sort opportunities by progress (closest first)
    progressionOpportunities.sort((a, b) => b.progressPercent - a.progressPercent);

    const distribution = Array.from(tierMap.values())
      .filter(item => item.stylistCount > 0)
      .sort((a, b) => a.tierRate - b.tierRate);

    return {
      distribution,
      progressionOpportunities,
      impactAnalysis: {
        currentPeriodCommissions,
        potentialAdditional,
        potentialIncreasePercent: currentPeriodCommissions > 0 
          ? (potentialAdditional / currentPeriodCommissions) * 100 
          : 0,
        revenueNeeded,
      },
    };
  }, [projection, tiers]);

  return {
    ...result,
    isLoading,
  };
}
