import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

export function useNewBookings() {
  const today = new Date();
  const todayStart = format(startOfDay(today), "yyyy-MM-dd'T'HH:mm:ss");
  const todayEnd = format(endOfDay(today), "yyyy-MM-dd'T'HH:mm:ss");
  const sevenDaysAgo = format(startOfDay(subDays(today, 7)), "yyyy-MM-dd'T'HH:mm:ss");

  return useQuery({
    queryKey: ['new-bookings', format(today, 'yyyy-MM-dd')],
    queryFn: async () => {
      // Fetch appointments created today
      const { data: todayBookings, error: todayError } = await supabase
        .from('phorest_appointments')
        .select('id, total_price, created_at')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .not('status', 'eq', 'cancelled');

      if (todayError) throw todayError;

      // Fetch appointments created in last 7 days
      const { data: last7DaysBookings, error: last7DaysError } = await supabase
        .from('phorest_appointments')
        .select('id, total_price, created_at')
        .gte('created_at', sevenDaysAgo)
        .lte('created_at', todayEnd)
        .not('status', 'eq', 'cancelled');

      if (last7DaysError) throw last7DaysError;

      const bookedToday = todayBookings || [];
      const bookedLast7Days = last7DaysBookings || [];

      return {
        bookedToday: bookedToday.length,
        bookedTodayRevenue: bookedToday.reduce((sum, apt) => sum + (Number(apt.total_price) || 0), 0),
        bookedLast7Days: bookedLast7Days.length,
        bookedLast7DaysRevenue: bookedLast7Days.reduce((sum, apt) => sum + (Number(apt.total_price) || 0), 0),
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
