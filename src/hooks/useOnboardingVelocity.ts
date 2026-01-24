import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subWeeks, startOfWeek, format, parseISO, isWithinInterval } from 'date-fns';

interface WeeklyOnboardingData {
  weekStart: string;
  tasksCompleted: number;
  handbooksCompleted: number;
}

export function useOnboardingVelocity(weeks: number = 8) {
  return useQuery({
    queryKey: ['onboarding-velocity', weeks],
    queryFn: async () => {
      const startDate = startOfWeek(subWeeks(new Date(), weeks));
      
      const [tasksResult, handbooksResult] = await Promise.all([
        supabase
          .from('onboarding_task_completions')
          .select('completed_at')
          .gte('completed_at', startDate.toISOString()),
        supabase
          .from('handbook_acknowledgments')
          .select('acknowledged_at')
          .gte('acknowledged_at', startDate.toISOString()),
      ]);

      const tasks = tasksResult.data || [];
      const handbooks = handbooksResult.data || [];

      // Create weekly buckets
      const weeklyData: WeeklyOnboardingData[] = [];
      
      for (let i = 0; i < weeks; i++) {
        const weekStart = startOfWeek(subWeeks(new Date(), weeks - 1 - i));
        const weekEnd = startOfWeek(subWeeks(new Date(), weeks - 2 - i));
        
        const weekTasks = tasks.filter(t => {
          if (!t.completed_at) return false;
          const completedAt = parseISO(t.completed_at);
          return isWithinInterval(completedAt, { start: weekStart, end: weekEnd });
        });

        const weekHandbooks = handbooks.filter(h => {
          if (!h.acknowledged_at) return false;
          const acknowledgedAt = parseISO(h.acknowledged_at);
          return isWithinInterval(acknowledgedAt, { start: weekStart, end: weekEnd });
        });

        weeklyData.push({
          weekStart: format(weekStart, 'MMM d'),
          tasksCompleted: weekTasks.length,
          handbooksCompleted: weekHandbooks.length,
        });
      }

      return {
        weeklyData,
        tasksTrend: weeklyData.map(w => w.tasksCompleted),
        handbooksTrend: weeklyData.map(w => w.handbooksCompleted),
        totalTrend: weeklyData.map(w => w.tasksCompleted + w.handbooksCompleted),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
