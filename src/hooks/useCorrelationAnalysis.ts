import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

export interface CorrelationPair {
  metricA: string;
  metricB: string;
  coefficient: number;
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative';
  dataPoints: number;
}

export interface CorrelationData {
  pairs: CorrelationPair[];
  matrix: Record<string, Record<string, number>>;
  scatterData: {
    metricA: string;
    metricB: string;
    points: { x: number; y: number; date: string }[];
  }[];
}

const CORRELATION_METRICS = [
  { key: 'total_revenue', label: 'Total Revenue' },
  { key: 'service_revenue', label: 'Service Revenue' },
  { key: 'product_revenue', label: 'Product Revenue' },
  { key: 'total_transactions', label: 'Transactions' },
];

export function useCorrelationAnalysis(locationId?: string, days = 90) {
  return useQuery({
    queryKey: ['correlation-analysis', locationId, days],
    queryFn: async (): Promise<CorrelationData> => {
      const endDate = new Date();
      const startDate = subDays(endDate, days);

      let query = supabase
        .from('phorest_daily_sales_summary')
        .select('summary_date, total_revenue, service_revenue, product_revenue, total_transactions, location_id')
        .gte('summary_date', format(startDate, 'yyyy-MM-dd'))
        .lte('summary_date', format(endDate, 'yyyy-MM-dd'))
        .order('summary_date', { ascending: true });

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const dailyData = (data || []).map(d => ({
        date: d.summary_date,
        total_revenue: Number(d.total_revenue) || 0,
        service_revenue: Number(d.service_revenue) || 0,
        product_revenue: Number(d.product_revenue) || 0,
        total_transactions: d.total_transactions || 0,
      }));

      // Calculate correlations between all pairs
      const pairs: CorrelationPair[] = [];
      const matrix: Record<string, Record<string, number>> = {};
      const scatterData: CorrelationData['scatterData'] = [];

      for (let i = 0; i < CORRELATION_METRICS.length; i++) {
        const metricA = CORRELATION_METRICS[i].key;
        matrix[metricA] = {};

        for (let j = 0; j < CORRELATION_METRICS.length; j++) {
          const metricB = CORRELATION_METRICS[j].key;

          if (i === j) {
            matrix[metricA][metricB] = 1;
            continue;
          }

          const valuesA = dailyData.map(d => d[metricA as keyof typeof d] as number);
          const valuesB = dailyData.map(d => d[metricB as keyof typeof d] as number);

          const coefficient = calculatePearsonCorrelation(valuesA, valuesB);
          matrix[metricA][metricB] = coefficient;

          // Only add unique pairs (avoid duplicates)
          if (i < j) {
            const strength = getCorrelationStrength(coefficient);
            pairs.push({
              metricA,
              metricB,
              coefficient,
              strength,
              direction: coefficient >= 0 ? 'positive' : 'negative',
              dataPoints: dailyData.length,
            });

            // Create scatter data for this pair
            scatterData.push({
              metricA,
              metricB,
              points: dailyData.map(d => ({
                x: d[metricA as keyof typeof d] as number,
                y: d[metricB as keyof typeof d] as number,
                date: d.date,
              })),
            });
          }
        }
      }

      // Sort by absolute correlation strength
      pairs.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));

      return { pairs, matrix, scatterData };
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0 || n !== y.length) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return 0;
  return numerator / denominator;
}

function getCorrelationStrength(coefficient: number): 'strong' | 'moderate' | 'weak' | 'none' {
  const abs = Math.abs(coefficient);
  if (abs >= 0.7) return 'strong';
  if (abs >= 0.4) return 'moderate';
  if (abs >= 0.2) return 'weak';
  return 'none';
}

export function getCorrelationColor(coefficient: number): string {
  const abs = Math.abs(coefficient);
  if (coefficient >= 0) {
    if (abs >= 0.7) return 'bg-green-500';
    if (abs >= 0.4) return 'bg-green-400';
    if (abs >= 0.2) return 'bg-green-300';
    return 'bg-gray-200';
  } else {
    if (abs >= 0.7) return 'bg-red-500';
    if (abs >= 0.4) return 'bg-red-400';
    if (abs >= 0.2) return 'bg-red-300';
    return 'bg-gray-200';
  }
}

export function getCorrelationLabel(pair: CorrelationPair): string {
  const metricLabels: Record<string, string> = {
    total_revenue: 'Total Revenue',
    service_revenue: 'Service Revenue',
    product_revenue: 'Product Revenue',
    total_transactions: 'Transactions',
  };

  const aLabel = metricLabels[pair.metricA] || pair.metricA;
  const bLabel = metricLabels[pair.metricB] || pair.metricB;
  
  return `${aLabel} vs ${bLabel}`;
}
