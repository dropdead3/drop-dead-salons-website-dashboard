import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, subDays } from 'date-fns';

export type PipelineStatus = 'healthy' | 'slowing' | 'critical';

interface BookingPipelineResult {
  forwardCount: number;
  baselineCount: number;
  ratio: number;
  status: PipelineStatus;
  label: string;
  isLoading: boolean;
}

export function useBookingPipeline(locationId?: string): BookingPipelineResult {
  const today = new Date();
  const tomorrow = format(addDays(today, 1), 'yyyy-MM-dd');
  const plus14 = format(addDays(today, 14), 'yyyy-MM-dd');
  const minus14 = format(subDays(today, 14), 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['booking-pipeline', locationId, todayStr],
    queryFn: async () => {
      // Forward pipeline: next 14 days
      let forwardQuery = supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('appointment_date', tomorrow)
        .lte('appointment_date', plus14)
        .not('status', 'in', '("cancelled","no_show")');

      if (locationId) {
        forwardQuery = forwardQuery.eq('location_id', locationId);
      }

      // Baseline: trailing 14 days
      let baselineQuery = supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('appointment_date', minus14)
        .lte('appointment_date', todayStr)
        .not('status', 'in', '("cancelled","no_show")');

      if (locationId) {
        baselineQuery = baselineQuery.eq('location_id', locationId);
      }

      const [forwardResult, baselineResult] = await Promise.all([
        forwardQuery,
        baselineQuery,
      ]);

      if (forwardResult.error) throw forwardResult.error;
      if (baselineResult.error) throw baselineResult.error;

      return {
        forwardCount: forwardResult.count ?? 0,
        baselineCount: baselineResult.count ?? 0,
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const forwardCount = data?.forwardCount ?? 0;
  const baselineCount = data?.baselineCount ?? 0;
  const ratio = baselineCount > 0 ? forwardCount / baselineCount : forwardCount > 0 ? 1 : 0;

  let status: PipelineStatus;
  let label: string;

  if (ratio >= 0.9) {
    status = 'healthy';
    label = 'Healthy';
  } else if (ratio >= 0.7) {
    status = 'slowing';
    label = 'Slowing';
  } else {
    status = 'critical';
    label = 'Critical';
  }

  return { forwardCount, baselineCount, ratio, status, label, isLoading };
}
