import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AvailabilityParams {
  branchId: string;
  staffId: string;
  serviceIds: string[];
  date: string;
}

interface AvailableSlot {
  start_time: string;
  end_time: string;
}

export function usePhorestAvailability() {
  return useMutation({
    mutationFn: async ({ branchId, staffId, serviceIds, date }: AvailabilityParams) => {
      const response = await supabase.functions.invoke('check-phorest-availability', {
        body: {
          branch_id: branchId,
          staff_id: staffId,
          service_ids: serviceIds,
          date,
        },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Failed to check availability');

      return response.data.available_slots as AvailableSlot[];
    },
  });
}
