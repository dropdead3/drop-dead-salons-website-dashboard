import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface LocationBreakdown {
  locationId: string;
  name: string;
  count: number;
}

// Helper: create a local Date at a specific day offset, set to start/end of day, return ISO string
function localDayBoundary(daysOffset: number, end: boolean): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  if (end) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d.toISOString();
}

export function useNewBookings(locationId?: string) {
  const today = new Date();
  const todayStart = localDayBoundary(0, false);
  const todayEnd = localDayBoundary(0, true);
  const sevenDaysAgoStart = localDayBoundary(-7, false);
  const thirtyDaysAgoStart = localDayBoundary(-30, false);
  const sixtyDaysAgoStart = localDayBoundary(-60, false);
  const thirtyOneDaysAgoEnd = localDayBoundary(-31, true);

  const todayDate = format(today, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['new-bookings', todayDate, locationId || 'all'],
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

      // Helper to apply location filter
      const applyLocFilter = (q: any) => {
        if (locationId && locationId !== 'all') {
          return q.eq('location_id', locationId);
        }
        return q;
      };

      // Fetch appointments created today
      const { data: todayBookings, error: todayError } = await applyLocFilter(
        supabase
          .from('phorest_appointments')
          .select('id, total_price, created_at, is_new_client, location_id')
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .not('status', 'eq', 'cancelled')
      );
      if (todayError) throw todayError;

      // Fetch last 7 days bookings
      const { data: last7DaysBookings, error: last7Error } = await applyLocFilter(
        supabase
          .from('phorest_appointments')
          .select('id, total_price, created_at')
          .gte('created_at', sevenDaysAgoStart)
          .lte('created_at', todayEnd)
          .not('status', 'eq', 'cancelled')
      );
      if (last7Error) throw last7Error;

      // Fetch last 30 days bookings
      const { data: last30DaysBookings, error: last30Error } = await applyLocFilter(
        supabase
          .from('phorest_appointments')
          .select('id, created_at, is_new_client')
          .gte('created_at', thirtyDaysAgoStart)
          .lte('created_at', todayEnd)
          .not('status', 'eq', 'cancelled')
      );
      if (last30Error) throw last30Error;

      // Fetch previous 30 days (31-60 days ago)
      const { data: prev30DaysBookings, error: prev30Error } = await applyLocFilter(
        supabase
          .from('phorest_appointments')
          .select('id, created_at')
          .gte('created_at', sixtyDaysAgoStart)
          .lte('created_at', thirtyOneDaysAgoEnd)
          .not('status', 'eq', 'cancelled')
      );
      if (prev30Error) throw prev30Error;

      // Fetch today's returning-client appointments (by appointment_date)
      const { data: rebookData, error: rebookError } = await applyLocFilter(
        supabase
          .from('phorest_appointments')
          .select('id, phorest_client_id, location_id')
          .eq('appointment_date', todayDate)
          .eq('is_new_client', false)
          .not('status', 'eq', 'cancelled')
      );
      if (rebookError) throw rebookError;

      const rebookAppointments = rebookData || [];
      const returningServicedToday = rebookAppointments.length;

      // Derive rebook status: check which of these clients have a future appointment
      let rebookedAtCheckoutToday = 0;
      const clientIds = [...new Set(
        rebookAppointments
          .map(a => a.phorest_client_id)
          .filter((id): id is string => !!id)
      )];

      if (clientIds.length > 0) {
        const { data: futureAppts, error: futureError } = await supabase
          .from('phorest_appointments')
          .select('phorest_client_id')
          .in('phorest_client_id', clientIds as readonly string[])
          .gt('appointment_date', todayDate)
          .not('status', 'eq', 'cancelled');
        if (futureError) throw futureError;

        const clientsWithFuture = new Set(
          (futureAppts || []).map(a => a.phorest_client_id as string)
        );

        // Count unique clients serviced today who have a future booking
        const countedClients = new Set<string>();
        for (const apt of rebookAppointments) {
          const cid = apt.phorest_client_id;
          if (cid && clientsWithFuture.has(cid) && !countedClients.has(cid)) {
            countedClients.add(cid);
            rebookedAtCheckoutToday++;
          }
        }
      }

      const rebookRate = returningServicedToday > 0
        ? Math.round((rebookedAtCheckoutToday / returningServicedToday) * 100)
        : null;

      const bookedToday = todayBookings || [];
      const bookedLast7Days = last7DaysBookings || [];
      const last30Days = last30DaysBookings || [];
      const prev30Days = prev30DaysBookings || [];

      const newClientToday = bookedToday.filter(apt => apt.is_new_client).length;
      const returningClientToday = bookedToday.filter(apt => !apt.is_new_client).length;

      // Location breakdown
      const byLocation: Record<string, { name: string; count: number }> = {};
      bookedToday.forEach(apt => {
        const locId = apt.location_id || 'unknown';
        if (!byLocation[locId]) {
          byLocation[locId] = { name: locationLookup[locId] || 'Unknown', count: 0 };
        }
        byLocation[locId].count += 1;
      });

      const locationBreakdown: LocationBreakdown[] = Object.entries(byLocation)
        .map(([id, data]) => ({ locationId: id, ...data }))
        .sort((a, b) => b.count - a.count);

      // 30-day comparison
      const last30Count = last30Days.length;
      const prev30Count = prev30Days.length;
      const percentChange = prev30Count > 0
        ? Math.round(((last30Count - prev30Count) / prev30Count) * 100)
        : 0;

      return {
        bookedToday: bookedToday.length,
        bookedTodayRevenue: bookedToday.reduce((sum, apt) => sum + (Number(apt.total_price) || 0), 0),
        bookedLast7Days: bookedLast7Days.length,
        bookedLast7DaysRevenue: bookedLast7Days.reduce((sum, apt) => sum + (Number(apt.total_price) || 0), 0),
        newClientToday,
        returningClientToday,
        last30Days: last30Count,
        prev30Days: prev30Count,
        percentChange,
        locationBreakdown,
        returningServicedToday,
        rebookedAtCheckoutToday,
        rebookRate,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
