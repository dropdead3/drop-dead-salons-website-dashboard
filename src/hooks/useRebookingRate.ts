import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RebookingRateResult {
  completed: number;
  rebooked: number;
  rebookRate: number;
}

/**
 * Rebooking rate for a date range: completed appointments and how many rebooked at checkout.
 * Shared by RebookingCard and useQuickStats for consistent cache key and logic.
 */
export function useRebookingRate(dateFrom: string, dateTo: string, locationId?: string) {
  return useQuery({
    queryKey: ['rebooking-rate', dateFrom, dateTo, locationId],
    queryFn: async (): Promise<RebookingRateResult> => {
      let query = supabase
        .from('phorest_appointments')
        .select('rebooked_at_checkout, status')
        .gte('appointment_date', dateFrom)
        .lte('appointment_date', dateTo)
        .eq('status', 'completed');

      if (locationId && locationId !== 'all') {
        query = query.eq('location_id', locationId);
      }
      const { data: rows, error } = await query;
      if (error) throw error;
      const completed = rows?.length ?? 0;
      const rebooked = rows?.filter((r) => r.rebooked_at_checkout).length ?? 0;
      const rebookRate = completed > 0 ? (rebooked / completed) * 100 : 0;
      return { completed, rebooked, rebookRate };
    },
    enabled: !!dateFrom && !!dateTo,
  });
}
