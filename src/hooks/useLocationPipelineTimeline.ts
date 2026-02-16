import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { eachDayOfInterval, format, subDays, addDays, startOfDay } from 'date-fns';

export interface DailyPipelinePoint {
  date: string;
  count: number;
  period: 'trailing' | 'forward';
}

export function useLocationPipelineTimeline(locationId: string, enabled: boolean) {
  const today = startOfDay(new Date());
  const startDate = subDays(today, 14);
  const endDate = addDays(today, 14);

  const startIso = format(startDate, 'yyyy-MM-dd');
  const endIso = format(endDate, 'yyyy-MM-dd');
  const todayIso = format(today, 'yyyy-MM-dd');

  const { data: raw, isLoading } = useQuery({
    queryKey: ['location-pipeline-timeline', locationId, startIso, endIso],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date')
        .eq('location_id', locationId)
        .gte('appointment_date', startIso)
        .lte('appointment_date', endIso)
        .not('status', 'in', '("cancelled","no_show")');
      if (error) throw error;
      return data;
    },
    enabled,
    staleTime: 60_000,
  });

  const dailyCounts: DailyPipelinePoint[] = useMemo(() => {
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    const countMap = new Map<string, number>();

    // Init all days to 0
    for (const day of allDays) {
      countMap.set(format(day, 'yyyy-MM-dd'), 0);
    }

    // Tally
    if (raw) {
      for (const row of raw) {
        const d = row.appointment_date;
        countMap.set(d, (countMap.get(d) ?? 0) + 1);
      }
    }

    return allDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return {
        date: dateStr,
        count: countMap.get(dateStr) ?? 0,
        period: dateStr < todayIso ? 'trailing' as const : 'forward' as const,
      };
    });
  }, [raw, startDate, endDate, todayIso]);

  return { dailyCounts, isLoading, todayIso };
}
