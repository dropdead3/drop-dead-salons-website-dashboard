import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subWeeks, startOfWeek, format, parseISO, isWithinInterval } from 'date-fns';

interface WeeklyRequestsData {
  weekStart: string;
  total: number;
  pending: number;
  accepted: number;
  declined: number;
}

export function useRequestsTrend(weeks: number = 8) {
  return useQuery({
    queryKey: ['requests-trend', weeks],
    queryFn: async () => {
      const startDate = startOfWeek(subWeeks(new Date(), weeks));
      
      const { data, error } = await supabase
        .from('assistant_requests')
        .select('created_at, status')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Create weekly buckets
      const weeklyData: WeeklyRequestsData[] = [];
      
      for (let i = 0; i < weeks; i++) {
        const weekStart = startOfWeek(subWeeks(new Date(), weeks - 1 - i));
        const weekEnd = startOfWeek(subWeeks(new Date(), weeks - 2 - i));
        
        const weekRequests = (data || []).filter(r => {
          const createdAt = parseISO(r.created_at);
          return isWithinInterval(createdAt, { start: weekStart, end: weekEnd });
        });

        weeklyData.push({
          weekStart: format(weekStart, 'MMM d'),
          total: weekRequests.length,
          pending: weekRequests.filter(r => r.status === 'pending').length,
          accepted: weekRequests.filter(r => r.status === 'accepted').length,
          declined: weekRequests.filter(r => r.status === 'declined').length,
        });
      }

      // Calculate acceptance rate trend
      const acceptanceRateTrend = weeklyData.map(w => {
        const total = w.accepted + w.declined;
        return total > 0 ? (w.accepted / total) * 100 : 0;
      });

      return {
        weeklyData,
        totalTrend: weeklyData.map(w => w.total),
        pendingTrend: weeklyData.map(w => w.pending),
        acceptedTrend: weeklyData.map(w => w.accepted),
        acceptanceRateTrend,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
