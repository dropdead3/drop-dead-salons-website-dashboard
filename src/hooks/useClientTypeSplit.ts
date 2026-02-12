import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientTypeSegment {
  label: string;
  count: number;
  revenue: number;
  avgTicket: number;
  rebookingRate: number;
  rebookedCount: number;
}

export interface ClientTypeSplitData {
  newClients: ClientTypeSegment;
  returningClients: ClientTypeSegment;
  totalTransactions: number;
  overallRebookingRate: number;
}

interface UseClientTypeSplitOptions {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  enabled?: boolean;
}

export function useClientTypeSplit({ dateFrom, dateTo, locationId, enabled = true }: UseClientTypeSplitOptions) {
  return useQuery({
    queryKey: ['client-type-split', dateFrom, dateTo, locationId || 'all'],
    queryFn: async (): Promise<ClientTypeSplitData> => {
      let query = supabase
        .from('phorest_appointments')
        .select('is_new_client, total_price, rebooked_at_checkout')
        .gte('appointment_date', dateFrom)
        .lte('appointment_date', dateTo)
        .not('status', 'in', '("cancelled","no_show")');

      if (locationId && locationId !== 'all') {
        query = query.eq('location_id', locationId);
      }

      const { data: appointments, error } = await query;
      if (error) throw error;

      const newData = { count: 0, revenue: 0, rebooked: 0 };
      const retData = { count: 0, revenue: 0, rebooked: 0 };

      (appointments || []).forEach(apt => {
        const price = Number(apt.total_price) || 0;
        const isNew = apt.is_new_client === true;
        const rebooked = apt.rebooked_at_checkout === true;

        if (isNew) {
          newData.count += 1;
          newData.revenue += price;
          if (rebooked) newData.rebooked += 1;
        } else {
          retData.count += 1;
          retData.revenue += price;
          if (rebooked) retData.rebooked += 1;
        }
      });

      const total = newData.count + retData.count;
      const totalRebooked = newData.rebooked + retData.rebooked;

      return {
        newClients: {
          label: 'New Clients',
          count: newData.count,
          revenue: newData.revenue,
          avgTicket: newData.count > 0 ? newData.revenue / newData.count : 0,
          rebookingRate: newData.count > 0 ? Math.round((newData.rebooked / newData.count) * 100) : 0,
          rebookedCount: newData.rebooked,
        },
        returningClients: {
          label: 'Returning Clients',
          count: retData.count,
          revenue: retData.revenue,
          avgTicket: retData.count > 0 ? retData.revenue / retData.count : 0,
          rebookingRate: retData.count > 0 ? Math.round((retData.rebooked / retData.count) * 100) : 0,
          rebookedCount: retData.rebooked,
        },
        totalTransactions: total,
        overallRebookingRate: total > 0 ? Math.round((totalRebooked / total) * 100) : 0,
      };
    },
    enabled: enabled && !!dateFrom && !!dateTo,
    staleTime: 5 * 60 * 1000,
  });
}
