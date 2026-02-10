import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useState } from 'react';

export type Scenario = 'conservative' | 'baseline' | 'optimistic';

export interface GrowthDataPoint {
  period: string;
  revenue: number;
  serviceRevenue: number;
  productRevenue: number;
  confidenceLower?: number;
  confidenceUpper?: number;
  type: 'actual' | 'projected';
}

export interface AccuracyDataPoint {
  period: string;
  projected: number;
  actual: number;
  accuracy: number;
}

export interface AccuracyData {
  history: AccuracyDataPoint[];
  average: number | null;
}

export interface GrowthSummary {
  momentum: 'accelerating' | 'steady' | 'decelerating';
  lastQoQGrowth: number | null;
  yoyGrowth: number | null;
  seasonalIndices: Record<number, number>;
  trendR2: number;
  dataPoints: number;
  quartersAvailable: number;
  nextQuarterBaseline: number;
  nextQuarterLabel: string;
}

export interface GrowthForecastData {
  actuals: GrowthDataPoint[];
  scenarios: Record<Scenario, GrowthDataPoint[]>;
  insights: string[];
  accuracy: AccuracyData;
  summary: GrowthSummary;
}

export function useGrowthForecast(locationId?: string) {
  const { effectiveOrganization } = useOrganizationContext();
  const [scenario, setScenario] = useState<Scenario>('baseline');

  const query = useQuery<GrowthForecastData>({
    queryKey: ['growth-forecast', effectiveOrganization?.id, locationId],
    queryFn: async () => {
      if (!effectiveOrganization?.id) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('growth-forecasting', {
        body: {
          organizationId: effectiveOrganization.id,
          locationId: locationId || 'all',
        },
      });

      if (error) throw error;
      return data as GrowthForecastData;
    },
    enabled: !!effectiveOrganization?.id,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,
  });

  return {
    ...query,
    scenario,
    setScenario,
  };
}
