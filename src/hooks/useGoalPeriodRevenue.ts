import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

type GoalPeriod = 'weekly' | 'monthly' | 'yearly';

function getPeriodStart(period: GoalPeriod): Date {
  const now = new Date();
  switch (period) {
    case 'weekly':
      return startOfWeek(now, { weekStartsOn: 1 });
    case 'monthly':
      return startOfMonth(now);
    case 'yearly':
      return startOfYear(now);
  }
}

export function useGoalPeriodRevenue(period: GoalPeriod, locationId?: string) {
  return useQuery({
    queryKey: ['goal-period-revenue', period, locationId],
    queryFn: async () => {
      const dateFrom = format(getPeriodStart(period), 'yyyy-MM-dd');
      const dateTo = format(new Date(), 'yyyy-MM-dd');

      let query = supabase
        .from('phorest_daily_sales_summary')
        .select('total_revenue')
        .gte('summary_date', dateFrom)
        .lte('summary_date', dateTo);

      if (locationId && locationId !== 'all') {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.reduce((sum, row) => sum + (Number(row.total_revenue) || 0), 0) ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });
}
