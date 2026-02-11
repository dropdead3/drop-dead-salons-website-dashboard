import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface TodayActualRevenueData {
  actualRevenue: number;
  actualServiceRevenue: number;
  actualProductRevenue: number;
  actualTransactions: number;
  lastAppointmentEndTime: string | null;
  hasActualData: boolean;
}

export function useTodayActualRevenue(enabled: boolean) {
  const today = format(new Date(), 'yyyy-MM-dd');

  const actualRevenueQuery = useQuery({
    queryKey: ['today-actual-revenue', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phorest_daily_sales_summary')
        .select('total_revenue, service_revenue, product_revenue, total_transactions')
        .eq('summary_date', today);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { totalRevenue: 0, serviceRevenue: 0, productRevenue: 0, totalTransactions: 0, hasData: false };
      }

      // Aggregate across all staff/locations for today
      const totals = data.reduce(
        (acc, row) => ({
          totalRevenue: acc.totalRevenue + (Number(row.total_revenue) || 0),
          serviceRevenue: acc.serviceRevenue + (Number(row.service_revenue) || 0),
          productRevenue: acc.productRevenue + (Number(row.product_revenue) || 0),
          totalTransactions: acc.totalTransactions + (Number(row.total_transactions) || 0),
        }),
        { totalRevenue: 0, serviceRevenue: 0, productRevenue: 0, totalTransactions: 0 }
      );

      return { ...totals, hasData: totals.totalRevenue > 0 };
    },
    enabled,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const lastAppointmentQuery = useQuery({
    queryKey: ['today-last-appointment', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phorest_appointments')
        .select('end_time')
        .eq('appointment_date', today)
        .not('status', 'in', '("cancelled","no_show")')
        .order('end_time', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0]?.end_time || null;
    },
    enabled,
  });

  const result: TodayActualRevenueData = {
    actualRevenue: actualRevenueQuery.data?.totalRevenue ?? 0,
    actualServiceRevenue: actualRevenueQuery.data?.serviceRevenue ?? 0,
    actualProductRevenue: actualRevenueQuery.data?.productRevenue ?? 0,
    actualTransactions: actualRevenueQuery.data?.totalTransactions ?? 0,
    lastAppointmentEndTime: lastAppointmentQuery.data ?? null,
    hasActualData: actualRevenueQuery.data?.hasData ?? false,
  };

  return {
    data: result,
    isLoading: actualRevenueQuery.isLoading || lastAppointmentQuery.isLoading,
  };
}
