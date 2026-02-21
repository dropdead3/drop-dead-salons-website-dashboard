import { useMemo } from 'react';
import { usePayrollForecasting, EmployeeProjection } from './usePayrollForecasting';
import { useStylistLevels } from './useStylistLevels';

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
  const { data: levels } = useStylistLevels();

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

    // Build distribution from stylist levels
    const levelMap = new Map<string, TierDistributionItem>();

    // Initialize with all active levels
    (levels || []).forEach(level => {
      levelMap.set(level.label, {
        tierName: level.label,
        tierRate: level.service_commission_rate ?? 0,
        stylistCount: 0,
        totalRevenue: 0,
        employees: [],
      });
    });

    let currentPeriodCommissions = 0;

    projection.byEmployee.forEach(emp => {
      const sourceName = emp.commissionSource || '';
      // Extract level name from "Level: X" format
      const levelName = sourceName.startsWith('Level: ') ? sourceName.replace('Level: ', '') : sourceName;

      const item = levelMap.get(levelName);
      if (item) {
        item.stylistCount++;
        item.totalRevenue += emp.projectedSales.services;
        item.employees.push({
          id: emp.employeeId,
          name: emp.employeeName,
          photoUrl: emp.photoUrl,
          revenue: emp.projectedSales.services,
          progress: emp.tierProgress,
        });
      }

      currentPeriodCommissions += emp.projectedCompensation.serviceCommission + emp.projectedCompensation.productCommission;
    });

    const distribution = Array.from(levelMap.values())
      .filter(item => item.stylistCount > 0)
      .sort((a, b) => a.tierRate - b.tierRate);

    return {
      distribution,
      progressionOpportunities: [],
      impactAnalysis: {
        currentPeriodCommissions,
        potentialAdditional: 0,
        potentialIncreasePercent: 0,
        revenueNeeded: 0,
      },
    };
  }, [projection, levels]);

  return {
    ...result,
    isLoading,
  };
}
