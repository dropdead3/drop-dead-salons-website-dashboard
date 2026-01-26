import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

export function useNewBookings() {
  const today = new Date();
  const todayStart = format(startOfDay(today), "yyyy-MM-dd'T'HH:mm:ss");
  const todayEnd = format(endOfDay(today), "yyyy-MM-dd'T'HH:mm:ss");
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd'T'HH:mm:ss");
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd'T'HH:mm:ss");

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

      // Fetch appointments created this week
      const { data: weekBookings, error: weekError } = await supabase
        .from('phorest_appointments')
        .select('id, total_price, created_at')
        .gte('created_at', weekStart)
        .lte('created_at', weekEnd)
        .not('status', 'eq', 'cancelled');

      if (weekError) throw weekError;

      const bookedToday = todayBookings || [];
      const bookedThisWeek = weekBookings || [];

      return {
        bookedToday: bookedToday.length,
        bookedTodayRevenue: bookedToday.reduce((sum, apt) => sum + (Number(apt.total_price) || 0), 0),
        bookedThisWeek: bookedThisWeek.length,
        bookedThisWeekRevenue: bookedThisWeek.reduce((sum, apt) => sum + (Number(apt.total_price) || 0), 0),
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
