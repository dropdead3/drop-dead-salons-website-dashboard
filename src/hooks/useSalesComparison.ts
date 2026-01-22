import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

interface ComparisonData {
  current: {
    totalRevenue: number;
    serviceRevenue: number;
    productRevenue: number;
    totalTransactions: number;
    averageTicket: number;
  };
  previous: {
    totalRevenue: number;
    serviceRevenue: number;
    productRevenue: number;
    totalTransactions: number;
    averageTicket: number;
  };
  percentChange: {
    totalRevenue: number;
    serviceRevenue: number;
    productRevenue: number;
    totalTransactions: number;
    averageTicket: number;
  };
}

export function useSalesComparison(dateFrom: string, dateTo: string, locationId?: string) {
  return useQuery({
    queryKey: ['sales-comparison', dateFrom, dateTo, locationId],
    queryFn: async (): Promise<ComparisonData> => {
      // Calculate the previous period (same duration before dateFrom)
      const currentFrom = new Date(dateFrom);
      const currentTo = new Date(dateTo);
      const daysDiff = Math.ceil((currentTo.getTime() - currentFrom.getTime()) / (1000 * 60 * 60 * 24));
      
      const previousTo = subDays(currentFrom, 1);
      const previousFrom = subDays(previousTo, daysDiff);

      // Fetch current period
      let currentQuery = supabase
        .from('phorest_daily_sales_summary')
        .select('total_revenue, service_revenue, product_revenue, total_transactions')
        .gte('summary_date', dateFrom)
        .lte('summary_date', dateTo);

      if (locationId) {
        currentQuery = currentQuery.eq('location_id', locationId);
      }

      const { data: currentData } = await currentQuery;

      // Fetch previous period
      let previousQuery = supabase
        .from('phorest_daily_sales_summary')
        .select('total_revenue, service_revenue, product_revenue, total_transactions')
        .gte('summary_date', format(previousFrom, 'yyyy-MM-dd'))
        .lte('summary_date', format(previousTo, 'yyyy-MM-dd'));

      if (locationId) {
        previousQuery = previousQuery.eq('location_id', locationId);
      }

      const { data: previousData } = await previousQuery;

      // Aggregate current
      const current = (currentData || []).reduce((acc, d) => ({
        totalRevenue: acc.totalRevenue + (Number(d.total_revenue) || 0),
        serviceRevenue: acc.serviceRevenue + (Number(d.service_revenue) || 0),
        productRevenue: acc.productRevenue + (Number(d.product_revenue) || 0),
        totalTransactions: acc.totalTransactions + (d.total_transactions || 0),
      }), { totalRevenue: 0, serviceRevenue: 0, productRevenue: 0, totalTransactions: 0 });

      // Aggregate previous
      const previous = (previousData || []).reduce((acc, d) => ({
        totalRevenue: acc.totalRevenue + (Number(d.total_revenue) || 0),
        serviceRevenue: acc.serviceRevenue + (Number(d.service_revenue) || 0),
        productRevenue: acc.productRevenue + (Number(d.product_revenue) || 0),
        totalTransactions: acc.totalTransactions + (d.total_transactions || 0),
      }), { totalRevenue: 0, serviceRevenue: 0, productRevenue: 0, totalTransactions: 0 });

      // Calculate averages
      const currentAvgTicket = current.totalTransactions > 0 
        ? current.totalRevenue / current.totalTransactions 
        : 0;
      const previousAvgTicket = previous.totalTransactions > 0 
        ? previous.totalRevenue / previous.totalTransactions 
        : 0;

      // Calculate percent changes
      const calcChange = (curr: number, prev: number) => 
        prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;

      return {
        current: { ...current, averageTicket: currentAvgTicket },
        previous: { ...previous, averageTicket: previousAvgTicket },
        percentChange: {
          totalRevenue: calcChange(current.totalRevenue, previous.totalRevenue),
          serviceRevenue: calcChange(current.serviceRevenue, previous.serviceRevenue),
          productRevenue: calcChange(current.productRevenue, previous.productRevenue),
          totalTransactions: calcChange(current.totalTransactions, previous.totalTransactions),
          averageTicket: calcChange(currentAvgTicket, previousAvgTicket),
        },
      };
    },
    enabled: !!dateFrom && !!dateTo,
  });
}
