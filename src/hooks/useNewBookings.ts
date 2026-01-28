import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

export function useNewBookings() {
  const today = new Date();
  const todayStart = format(startOfDay(today), "yyyy-MM-dd'T'HH:mm:ss");
  const todayEnd = format(endOfDay(today), "yyyy-MM-dd'T'HH:mm:ss");
  
  // Legacy 7-day range (for backward compatibility)
  const sevenDaysAgo = format(startOfDay(subDays(today, 7)), "yyyy-MM-dd'T'HH:mm:ss");
  
  // 30-day ranges
  const thirtyDaysAgo = format(startOfDay(subDays(today, 30)), "yyyy-MM-dd'T'HH:mm:ss");
  const sixtyDaysAgo = format(startOfDay(subDays(today, 60)), "yyyy-MM-dd'T'HH:mm:ss");
  const thirtyOneDaysAgo = format(endOfDay(subDays(today, 31)), "yyyy-MM-dd'T'HH:mm:ss");

  return useQuery({
    queryKey: ['new-bookings', format(today, 'yyyy-MM-dd')],
    queryFn: async () => {
      // Fetch appointments created today with is_new_client flag
      const { data: todayBookings, error: todayError } = await supabase
        .from('phorest_appointments')
        .select('id, total_price, created_at, is_new_client')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .not('status', 'eq', 'cancelled');

      if (todayError) throw todayError;

      // Fetch last 7 days bookings (for backward compatibility)
      const { data: last7DaysBookings, error: last7Error } = await supabase
        .from('phorest_appointments')
        .select('id, total_price, created_at')
        .gte('created_at', sevenDaysAgo)
        .lte('created_at', todayEnd)
        .not('status', 'eq', 'cancelled');

      if (last7Error) throw last7Error;

      // Fetch last 30 days bookings
      const { data: last30DaysBookings, error: last30Error } = await supabase
        .from('phorest_appointments')
        .select('id, created_at, is_new_client')
        .gte('created_at', thirtyDaysAgo)
        .lte('created_at', todayEnd)
        .not('status', 'eq', 'cancelled');

      if (last30Error) throw last30Error;

      // Fetch previous 30 days (31-60 days ago)
      const { data: prev30DaysBookings, error: prev30Error } = await supabase
        .from('phorest_appointments')
        .select('id, created_at')
        .gte('created_at', sixtyDaysAgo)
        .lte('created_at', thirtyOneDaysAgo)
        .not('status', 'eq', 'cancelled');

      if (prev30Error) throw prev30Error;

      const bookedToday = todayBookings || [];
      const bookedLast7Days = last7DaysBookings || [];
      const last30Days = last30DaysBookings || [];
      const prev30Days = prev30DaysBookings || [];

      // Break down today's bookings
      const newClientToday = bookedToday.filter(apt => apt.is_new_client).length;
      const returningClientToday = bookedToday.filter(apt => !apt.is_new_client).length;

      // Calculate 30-day comparison
      const last30Count = last30Days.length;
      const prev30Count = prev30Days.length;
      const percentChange = prev30Count > 0 
        ? Math.round(((last30Count - prev30Count) / prev30Count) * 100)
        : 0;

      return {
        // Legacy metrics (for backward compatibility)
        bookedToday: bookedToday.length,
        bookedTodayRevenue: bookedToday.reduce((sum, apt) => sum + (Number(apt.total_price) || 0), 0),
        bookedLast7Days: bookedLast7Days.length,
        bookedLast7DaysRevenue: bookedLast7Days.reduce((sum, apt) => sum + (Number(apt.total_price) || 0), 0),
        // New metrics
        newClientToday,
        returningClientToday,
        last30Days: last30Count,
        prev30Days: prev30Count,
        percentChange,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
