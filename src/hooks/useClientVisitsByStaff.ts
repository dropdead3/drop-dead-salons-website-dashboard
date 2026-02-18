import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StaffVisitDetail {
  staffId: string;
  staffName: string;
  userId: string | null;
  totalVisits: number;
  newClientVisits: number;
  returningClientVisits: number;
  avgTicket: number;
  topServices: { name: string; count: number }[];
}

interface ClientVisitsData {
  totalVisits: number;
  priorTotalVisits: number;
  percentChange: number | null;
  overallReturningRate: number;
  priorReturningRate: number;
  returningPercentChange: number | null;
  staffBreakdown: StaffVisitDetail[];
}

async function fetchAllAppointments(
  dateFrom: string,
  dateTo: string,
  locationId?: string,
  fields = 'phorest_staff_id, is_new_client, total_price, service_name, status'
) {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('phorest_appointments')
      .select(fields)
      .gte('appointment_date', dateFrom)
      .lte('appointment_date', dateTo)
      .not('status', 'in', '("cancelled","no_show")')
      .range(from, from + PAGE_SIZE - 1);

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    allData = allData.concat(data || []);
    hasMore = (data?.length || 0) === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  return allData;
}

export function useClientVisitsByStaff(
  dateFrom: string,
  dateTo: string,
  locationId?: string
) {
  return useQuery<ClientVisitsData>({
    queryKey: ['client-visits-by-staff', dateFrom, dateTo, locationId],
    queryFn: async () => {
      // Calculate prior period
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      const durationMs = to.getTime() - from.getTime();
      const priorFrom = new Date(from.getTime() - durationMs - 86400000); // -1 day for inclusive
      const priorTo = new Date(from.getTime() - 86400000);
      const priorFromStr = priorFrom.toISOString().split('T')[0];
      const priorToStr = priorTo.toISOString().split('T')[0];

      // Fetch staff mappings
      const { data: mappings } = await supabase
        .from('phorest_staff_mapping')
        .select(`
          phorest_staff_id,
          user_id,
          phorest_staff_name,
          employee_profiles!phorest_staff_mapping_user_id_fkey (
            display_name,
            full_name
          )
        `)
        .eq('is_active', true);

      const mappingLookup: Record<string, { userId: string | null; name: string }> = {};
      mappings?.forEach(m => {
        const profile = m.employee_profiles as any;
        mappingLookup[m.phorest_staff_id] = {
          userId: m.user_id,
          name: profile?.display_name || profile?.full_name || m.phorest_staff_name || 'Unknown',
        };
      });

      // Fetch current and prior period in parallel
      const [currentAppointments, priorAppointments] = await Promise.all([
        fetchAllAppointments(dateFrom, dateTo, locationId),
        fetchAllAppointments(priorFromStr, priorToStr, locationId, 'phorest_staff_id, is_new_client, status'),
      ]);

      const totalVisits = currentAppointments.length;
      const priorTotalVisits = priorAppointments.length;
      const percentChange = priorTotalVisits > 0
        ? ((totalVisits - priorTotalVisits) / priorTotalVisits) * 100
        : null;

      // Group by staff
      const staffMap: Record<string, {
        visits: number;
        newClients: number;
        revenue: number;
        services: Record<string, number>;
      }> = {};

      currentAppointments.forEach(apt => {
        const staffId = apt.phorest_staff_id;
        if (!staffId) return;

        if (!staffMap[staffId]) {
          staffMap[staffId] = { visits: 0, newClients: 0, revenue: 0, services: {} };
        }

        const entry = staffMap[staffId];
        entry.visits += 1;
        if (apt.is_new_client === true) entry.newClients += 1;
        entry.revenue += Number(apt.total_price) || 0;

        const svc = apt.service_name;
        if (svc) {
          entry.services[svc] = (entry.services[svc] || 0) + 1;
        }
      });

      const staffBreakdown: StaffVisitDetail[] = Object.entries(staffMap)
        .map(([phorestStaffId, data]) => {
          const mapping = mappingLookup[phorestStaffId];
          const topServices = Object.entries(data.services)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

          return {
            staffId: phorestStaffId,
            staffName: mapping?.name || phorestStaffId,
            userId: mapping?.userId || null,
            totalVisits: data.visits,
            newClientVisits: data.newClients,
            returningClientVisits: data.visits - data.newClients,
            avgTicket: data.visits > 0 ? data.revenue / data.visits : 0,
            topServices,
          };
        })
        .sort((a, b) => b.totalVisits - a.totalVisits);

      // Returning client rates
      const totalReturning = currentAppointments.filter(a => a.is_new_client !== true).length;
      const overallReturningRate = totalVisits > 0 ? (totalReturning / totalVisits) * 100 : 0;

      const priorReturning = priorAppointments.filter(a => a.is_new_client !== true).length;
      const priorReturningRate = priorTotalVisits > 0 ? (priorReturning / priorTotalVisits) * 100 : 0;

      const returningPercentChange = priorReturningRate > 0
        ? ((overallReturningRate - priorReturningRate) / priorReturningRate) * 100
        : null;

      return {
        totalVisits,
        priorTotalVisits,
        percentChange,
        overallReturningRate,
        priorReturningRate,
        returningPercentChange,
        staffBreakdown,
      };
    },
  });
}
