import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subWeeks, startOfWeek, format, parseISO, isWithinInterval } from 'date-fns';

interface WeeklyEnrollmentData {
  weekStart: string;
  enrolled: number;
  active: number;
  completed: number;
  paused: number;
}

export function useEnrollmentTrend(weeks: number = 8) {
  return useQuery({
    queryKey: ['enrollment-trend', weeks],
    queryFn: async () => {
      const startDate = startOfWeek(subWeeks(new Date(), weeks));
      
      const { data, error } = await supabase
        .from('stylist_program_enrollment')
        .select('created_at, status, updated_at')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Create weekly buckets
      const weeklyData: WeeklyEnrollmentData[] = [];
      
      for (let i = 0; i < weeks; i++) {
        const weekStart = startOfWeek(subWeeks(new Date(), weeks - 1 - i));
        const weekEnd = startOfWeek(subWeeks(new Date(), weeks - 2 - i));
        
        const weekEnrollments = (data || []).filter(e => {
          const createdAt = parseISO(e.created_at);
          return isWithinInterval(createdAt, { start: weekStart, end: weekEnd });
        });

        weeklyData.push({
          weekStart: format(weekStart, 'MMM d'),
          enrolled: weekEnrollments.length,
          active: weekEnrollments.filter(e => e.status === 'active').length,
          completed: weekEnrollments.filter(e => e.status === 'completed').length,
          paused: weekEnrollments.filter(e => e.status === 'paused').length,
        });
      }

      // Generate sparkline arrays
      return {
        weeklyData,
        enrolledTrend: weeklyData.map(w => w.enrolled),
        activeTrend: weeklyData.map(w => w.active),
        completedTrend: weeklyData.map(w => w.completed),
        pausedTrend: weeklyData.map(w => w.paused),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
