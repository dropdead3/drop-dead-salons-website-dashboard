import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StaffRebookingDetail {
  staffId: string;
  staffName: string;
  userId: string | null;
  totalAppointments: number;
  rebookedCount: number;
  rebookingRate: number;
  avgTicketRebooked: number;
  avgTicketNotRebooked: number;
}

interface RebookingData {
  overallRate: number;
  priorOverallRate: number;
  percentChange: number | null;
  staffBreakdown: StaffRebookingDetail[];
}

async function fetchRebookingAppointments(
  dateFrom: string,
  dateTo: string,
  locationId?: string,
  fields = 'phorest_staff_id, rebooked_at_checkout, total_price, status'
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

export function useRebookingByStaff(
  dateFrom: string,
  dateTo: string,
  locationId?: string
) {
  return useQuery<RebookingData>({
    queryKey: ['rebooking-by-staff', dateFrom, dateTo, locationId],
    queryFn: async () => {
      // Calculate prior period
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      const durationMs = to.getTime() - from.getTime();
      const priorFrom = new Date(from.getTime() - durationMs - 86400000);
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

      // Fetch current and prior period
      const [currentAppts, priorAppts] = await Promise.all([
        fetchRebookingAppointments(dateFrom, dateTo, locationId),
        fetchRebookingAppointments(priorFromStr, priorToStr, locationId, 'rebooked_at_checkout, status'),
      ]);

      // Overall rates
      const currentRebooked = currentAppts.filter(a => a.rebooked_at_checkout === true).length;
      const overallRate = currentAppts.length > 0 ? (currentRebooked / currentAppts.length) * 100 : 0;

      const priorRebooked = priorAppts.filter(a => a.rebooked_at_checkout === true).length;
      const priorOverallRate = priorAppts.length > 0 ? (priorRebooked / priorAppts.length) * 100 : 0;

      const percentChange = priorOverallRate > 0
        ? ((overallRate - priorOverallRate) / priorOverallRate) * 100
        : null;

      // Group by staff
      const staffMap: Record<string, {
        total: number;
        rebooked: number;
        revenueRebooked: number;
        revenueNotRebooked: number;
      }> = {};

      currentAppts.forEach(apt => {
        const staffId = apt.phorest_staff_id;
        if (!staffId) return;

        if (!staffMap[staffId]) {
          staffMap[staffId] = { total: 0, rebooked: 0, revenueRebooked: 0, revenueNotRebooked: 0 };
        }

        const entry = staffMap[staffId];
        entry.total += 1;
        const price = Number(apt.total_price) || 0;

        if (apt.rebooked_at_checkout === true) {
          entry.rebooked += 1;
          entry.revenueRebooked += price;
        } else {
          entry.revenueNotRebooked += price;
        }
      });

      const staffBreakdown: StaffRebookingDetail[] = Object.entries(staffMap)
        .map(([phorestStaffId, data]) => {
          const mapping = mappingLookup[phorestStaffId];
          return {
            staffId: phorestStaffId,
            staffName: mapping?.name || phorestStaffId,
            userId: mapping?.userId || null,
            totalAppointments: data.total,
            rebookedCount: data.rebooked,
            rebookingRate: data.total > 0 ? (data.rebooked / data.total) * 100 : 0,
            avgTicketRebooked: data.rebooked > 0 ? data.revenueRebooked / data.rebooked : 0,
            avgTicketNotRebooked: (data.total - data.rebooked) > 0 ? data.revenueNotRebooked / (data.total - data.rebooked) : 0,
          };
        })
        .sort((a, b) => b.rebookingRate - a.rebookingRate);

      return {
        overallRate,
        priorOverallRate,
        percentChange,
        staffBreakdown,
      };
    },
  });
}
