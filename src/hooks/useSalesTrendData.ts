import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, parseISO, startOfDay } from 'date-fns';

interface DailySalesData {
  date: string;
  revenue: number;
  services: number;
  products: number;
  transactions: number;
}

export function useSalesTrendData(days: number = 14, locationId?: string) {
  return useQuery({
    queryKey: ['sales-trend-data', days, locationId],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');

      let query = supabase
        .from('phorest_appointments')
        .select('appointment_date, total_price, service_name')
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .not('total_price', 'is', null);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by date
      const dailyMap = new Map<string, DailySalesData>();
      
      // Initialize all days
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
        dailyMap.set(date, {
          date,
          revenue: 0,
          services: 0,
          products: 0,
          transactions: 0,
        });
      }

      // Fill in actual data
      (data || []).forEach(apt => {
        const existing = dailyMap.get(apt.appointment_date);
        if (existing) {
          existing.revenue += Number(apt.total_price) || 0;
          existing.transactions += 1;
          // Assume all from appointments are services for now
          existing.services += Number(apt.total_price) || 0;
        }
      });

      const dailyData = Array.from(dailyMap.values());

      return {
        dailyData,
        revenueTrend: dailyData.map(d => d.revenue),
        servicesTrend: dailyData.map(d => d.services),
        productsTrend: dailyData.map(d => d.products),
        transactionsTrend: dailyData.map(d => d.transactions),
        // Calculate averages for avg ticket sparkline
        avgTicketTrend: dailyData.map(d => 
          d.transactions > 0 ? d.revenue / d.transactions : 0
        ),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
