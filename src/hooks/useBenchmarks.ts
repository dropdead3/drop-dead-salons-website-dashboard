import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Benchmark {
  id: string;
  organization_id: string | null;
  metric_key: string;
  benchmark_type: string;
  value: number;
  context: string | null;
  valid_from: string | null;
  valid_to: string | null;
}

export interface BenchmarkContext {
  metricKey: string;
  currentValue: number;
  benchmarks: {
    type: 'industry' | 'historical' | 'goal' | 'peer';
    value: number;
    label: string;
    percentDiff: number;
  }[];
}

export function useBenchmarks(metricKeys?: string[]) {
  return useQuery({
    queryKey: ['metric-benchmarks', metricKeys],
    queryFn: async (): Promise<Benchmark[]> => {
      let query = supabase
        .from('metric_benchmarks')
        .select('*');

      if (metricKeys && metricKeys.length > 0) {
        query = query.in('metric_key', metricKeys);
      }

      // Filter by valid date range
      const today = new Date().toISOString().split('T')[0];
      query = query
        .or(`valid_from.is.null,valid_from.lte.${today}`)
        .or(`valid_to.is.null,valid_to.gte.${today}`);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useBenchmarkContext(metricKey: string, currentValue: number): BenchmarkContext {
  const { data: benchmarks } = useBenchmarks([metricKey]);

  const contextBenchmarks = (benchmarks || [])
    .filter(b => b.metric_key === metricKey)
    .map(b => {
      const percentDiff = currentValue !== 0 
        ? ((currentValue - b.value) / b.value) * 100 
        : 0;

      let label = '';
      switch (b.benchmark_type) {
        case 'industry':
          label = 'Industry Avg';
          break;
        case 'historical_avg':
          label = 'Your 90-day Avg';
          break;
        case 'goal':
          label = 'Goal';
          break;
        case 'peer_group':
          label = 'Peer Group';
          break;
        default:
          label = b.benchmark_type;
      }

      return {
        type: b.benchmark_type as 'industry' | 'historical' | 'goal' | 'peer',
        value: b.value,
        label,
        percentDiff,
      };
    });

  return {
    metricKey,
    currentValue,
    benchmarks: contextBenchmarks,
  };
}

export function getBenchmarkColor(percentDiff: number, isInverse = false): string {
  // For metrics where lower is better (like no_show_rate), invert the logic
  const adjustedDiff = isInverse ? -percentDiff : percentDiff;
  
  if (adjustedDiff >= 10) return 'text-green-500';
  if (adjustedDiff >= 0) return 'text-emerald-500';
  if (adjustedDiff >= -10) return 'text-amber-500';
  return 'text-red-500';
}
