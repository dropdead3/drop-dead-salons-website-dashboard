import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, startOfMonth, endOfMonth, subMonths, subDays } from 'date-fns';
import type { DateRangeType } from '@/components/dashboard/PinnedAnalyticsCard';

export interface LocationBreakdown {
  locationId: string;
  name: string;
  count: number;
}

function getDateBounds(dateRange: DateRangeType | undefined): { startDate: string; endDate: string } {
  const today = new Date();
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

  switch (dateRange) {
    case 'yesterday': {
      const y = subDays(today, 1);
      return { startDate: fmt(y), endDate: fmt(y) };
    }
    case '7d':
      return { startDate: fmt(subDays(today, 6)), endDate: fmt(today) };
    case '30d':
      return { startDate: fmt(subDays(today, 29)), endDate: fmt(today) };
    case 'thisWeek':
      return { startDate: fmt(startOfWeek(today, { weekStartsOn: 1 })), endDate: fmt(today) };
    case 'thisMonth':
      return { startDate: fmt(startOfMonth(today)), endDate: fmt(today) };
    case 'lastMonth': {
      const lm = subMonths(today, 1);
      return { startDate: fmt(startOfMonth(lm)), endDate: fmt(endOfMonth(lm)) };
    }
    case 'todayToEom':
      return { startDate: fmt(today), endDate: fmt(endOfMonth(today)) };
    case 'todayToPayday': {
      // Approximate next payday as 15th or last day of month
      const day = today.getDate();
      let payday: Date;
      if (day < 15) {
        payday = new Date(today.getFullYear(), today.getMonth(), 15);
      } else {
        payday = endOfMonth(today);
      }
      return { startDate: fmt(today), endDate: fmt(payday) };
    }
    case 'today':
    default:
      return { startDate: fmt(today), endDate: fmt(today) };
  }
}

export function useNewBookings(locationId?: string, dateRange?: DateRangeType) {
  const { startDate, endDate } = getDateBounds(dateRange);
  const todayDate = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['new-bookings', startDate, endDate, locationId || 'all'],
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

      // Fetch appointments in the selected range (by appointment_date)
      const { data: rangeBookings, error: rangeError } = await applyLocFilter(
        supabase
          .from('phorest_appointments')
          .select('id, total_price, appointment_date, phorest_client_id, location_id')
          .gte('appointment_date', startDate)
          .lte('appointment_date', endDate)
          .not('status', 'eq', 'cancelled')
      );
      if (rangeError) throw rangeError;

      // Determine truly new clients: clients whose first-ever appointment falls within the range
      const rangeClientIdSet = new Set<string>();
      (rangeBookings || []).forEach(a => {
        if (a.phorest_client_id) rangeClientIdSet.add(a.phorest_client_id as string);
      });
      const rangeClientIds = Array.from(rangeClientIdSet);

      const newClientPhorestIds = new Set<string>();
      if (rangeClientIds.length > 0) {
        // Batch check: for each client, see if they have any appointment before startDate
        const { data: priorAppts } = await supabase
          .from('phorest_appointments')
          .select('phorest_client_id')
          .in('phorest_client_id', rangeClientIds as readonly string[])
          .lt('appointment_date', startDate)
          .not('status', 'eq', 'cancelled')
          .limit(1000);

        const clientsWithPriorVisit = new Set(
          (priorAppts || []).map(a => a.phorest_client_id as string)
        );

        for (const cid of rangeClientIds) {
          if (!clientsWithPriorVisit.has(cid)) {
            newClientPhorestIds.add(cid);
          }
        }
      }

      // 30-day comparison (always relative to today for long-term context)
      const thirtyDaysAgoStart = format(subDays(new Date(), 29), 'yyyy-MM-dd');
      const sixtyDaysAgoStart = format(subDays(new Date(), 59), 'yyyy-MM-dd');
      const thirtyOneDaysAgoEnd = format(subDays(new Date(), 30), 'yyyy-MM-dd');

      const [last30Res, prev30Res] = await Promise.all([
        applyLocFilter(
          supabase
            .from('phorest_appointments')
            .select('id')
            .gte('appointment_date', thirtyDaysAgoStart)
            .lte('appointment_date', todayDate)
            .not('status', 'eq', 'cancelled')
        ),
        applyLocFilter(
          supabase
            .from('phorest_appointments')
            .select('id')
            .gte('appointment_date', sixtyDaysAgoStart)
            .lte('appointment_date', thirtyOneDaysAgoEnd)
            .not('status', 'eq', 'cancelled')
        ),
      ]);
      if (last30Res.error) throw last30Res.error;
      if (prev30Res.error) throw prev30Res.error;

      // Rebook rate: returning clients within range who have a future appointment
      const rebookQuery = await applyLocFilter(
        supabase
          .from('phorest_appointments')
          .select('id, phorest_client_id, location_id')
          .gte('appointment_date', startDate)
          .lte('appointment_date', endDate)
          .eq('is_new_client', false)
          .not('status', 'eq', 'cancelled')
      );
      if (rebookQuery.error) throw rebookQuery.error;

      const rebookAppointments = rebookQuery.data || [];
      // For rebook, "returning" means NOT a new client
      const returningRebookAppts = rebookAppointments.filter(
        a => !a.phorest_client_id || !newClientPhorestIds.has(a.phorest_client_id)
      );
      const returningServicedInRange = returningRebookAppts.length;

      let rebookedAtCheckoutInRange = 0;
      const rebookClientIds = [...new Set(
        returningRebookAppts
          .map(a => a.phorest_client_id)
          .filter((id): id is string => !!id)
      )];

      if (rebookClientIds.length > 0) {
        const { data: futureAppts, error: futureError } = await supabase
          .from('phorest_appointments')
          .select('phorest_client_id')
          .in('phorest_client_id', rebookClientIds as readonly string[])
          .gt('appointment_date', endDate)
          .not('status', 'eq', 'cancelled');
        if (futureError) throw futureError;

        const clientsWithFuture = new Set(
          (futureAppts || []).map(a => a.phorest_client_id as string)
        );

        const countedClients = new Set<string>();
        for (const apt of returningRebookAppts) {
          const cid = apt.phorest_client_id;
          if (cid && clientsWithFuture.has(cid) && !countedClients.has(cid)) {
            countedClients.add(cid);
            rebookedAtCheckoutInRange++;
          }
        }
      }

      const rebookRate = returningServicedInRange > 0
        ? Math.round((rebookedAtCheckoutInRange / returningServicedInRange) * 100)
        : null;

      const booked = rangeBookings || [];
      const newClientCount = booked.filter(apt => apt.phorest_client_id && newClientPhorestIds.has(apt.phorest_client_id)).length;
      const returningClientCount = booked.length - newClientCount;

      // Location breakdown
      const byLocation: Record<string, { name: string; count: number }> = {};
      booked.forEach(apt => {
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
      const last30Count = last30Res.data?.length || 0;
      const prev30Count = prev30Res.data?.length || 0;
      const percentChange = prev30Count > 0
        ? Math.round(((last30Count - prev30Count) / prev30Count) * 100)
        : 0;

      return {
        bookedInRange: booked.length,
        bookedInRangeRevenue: booked.reduce((sum, apt) => sum + (Number(apt.total_price) || 0), 0),
        newClientCount,
        returningClientCount,
        last30Days: last30Count,
        prev30Days: prev30Count,
        percentChange,
        locationBreakdown,
        returningServicedInRange,
        rebookedAtCheckoutInRange,
        rebookRate,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
