import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

export interface LocationBreakdown {
  locationId: string;
  name: string;
  count: number;
}

export function useNewBookings(locationId?: string) {
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
    queryKey: ['new-bookings', format(today, 'yyyy-MM-dd'), locationId || 'all'],
    queryFn: async () => {
      // Fetch locations for name lookup
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name')
        .eq('is_active', true);

      const locationLookup: Record<string, string> = {};
      locations?.forEach(loc => {
        locationLookup[loc.id] = loc.name;
      });

      // Fetch appointments created today with is_new_client flag and location_id
      let todayQuery = supabase
        .from('phorest_appointments')
        .select('id, total_price, created_at, is_new_client, location_id')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .not('status', 'eq', 'cancelled');

      if (locationId && locationId !== 'all') {
        todayQuery = todayQuery.eq('location_id', locationId);
      }

      const { data: todayBookings, error: todayError } = await todayQuery;
      if (todayError) throw todayError;

      // Fetch last 7 days bookings (for backward compatibility)
      let last7Query = supabase
        .from('phorest_appointments')
        .select('id, total_price, created_at')
        .gte('created_at', sevenDaysAgo)
        .lte('created_at', todayEnd)
        .not('status', 'eq', 'cancelled');

      if (locationId && locationId !== 'all') {
        last7Query = last7Query.eq('location_id', locationId);
      }

      const { data: last7DaysBookings, error: last7Error } = await last7Query;
      if (last7Error) throw last7Error;

      // Fetch last 30 days bookings
      let last30Query = supabase
        .from('phorest_appointments')
        .select('id, created_at, is_new_client')
        .gte('created_at', thirtyDaysAgo)
        .lte('created_at', todayEnd)
        .not('status', 'eq', 'cancelled');

      if (locationId && locationId !== 'all') {
        last30Query = last30Query.eq('location_id', locationId);
      }

      const { data: last30DaysBookings, error: last30Error } = await last30Query;
      if (last30Error) throw last30Error;

      // Fetch previous 30 days (31-60 days ago)
      let prev30Query = supabase
        .from('phorest_appointments')
        .select('id, created_at')
        .gte('created_at', sixtyDaysAgo)
        .lte('created_at', thirtyOneDaysAgo)
        .not('status', 'eq', 'cancelled');

      if (locationId && locationId !== 'all') {
        prev30Query = prev30Query.eq('location_id', locationId);
      }

      const { data: prev30DaysBookings, error: prev30Error } = await prev30Query;
      if (prev30Error) throw prev30Error;

      const bookedToday = todayBookings || [];
      const bookedLast7Days = last7DaysBookings || [];
      const last30Days = last30DaysBookings || [];
      const prev30Days = prev30DaysBookings || [];

      // Break down today's bookings
      const newClientToday = bookedToday.filter(apt => apt.is_new_client).length;
      const returningClientToday = bookedToday.filter(apt => !apt.is_new_client).length;

      // Calculate location breakdown from today's bookings
      const byLocation: Record<string, { name: string; count: number }> = {};
      bookedToday.forEach(apt => {
        const locId = apt.location_id || 'unknown';
        if (!byLocation[locId]) {
          byLocation[locId] = {
            name: locationLookup[locId] || 'Unknown',
            count: 0,
          };
        }
        byLocation[locId].count += 1;
      });

      const locationBreakdown: LocationBreakdown[] = Object.entries(byLocation)
        .map(([id, data]) => ({ locationId: id, ...data }))
        .sort((a, b) => b.count - a.count);

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
        locationBreakdown,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
