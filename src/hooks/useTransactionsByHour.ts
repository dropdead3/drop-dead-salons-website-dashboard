import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HourlyTransaction {
  hour: number;
  count: number;
}

export function useTransactionsByHour(dateFrom?: string, dateTo?: string, locationId?: string) {
  return useQuery({
    queryKey: ['transactions-by-hour', dateFrom, dateTo, locationId],
    queryFn: async () => {
      let query = supabase
        .from('phorest_sales_transactions')
        .select('transaction_time');

      if (dateFrom) query = query.gte('transaction_date', dateFrom);
      if (dateTo) query = query.lte('transaction_date', dateTo);
      if (locationId && locationId !== 'all') query = query.eq('location_id', locationId);

      const { data, error } = await query;
      if (error) throw error;

      // Group by hour
      const hourMap: Record<number, number> = {};
      data?.forEach(row => {
        if (!row.transaction_time) return;
        const hour = parseInt(row.transaction_time.split(':')[0]);
        hourMap[hour] = (hourMap[hour] || 0) + 1;
      });

      // Fill 8AM-8PM range
      const result: HourlyTransaction[] = [];
      for (let h = 8; h <= 20; h++) {
        result.push({ hour: h, count: hourMap[h] || 0 });
      }
      return result;
    },
    enabled: !!dateFrom && !!dateTo,
  });
}
