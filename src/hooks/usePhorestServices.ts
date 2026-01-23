import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PhorestService {
  id: string;
  phorest_service_id: string;
  phorest_branch_id: string;
  name: string;
  category: string | null;
  duration_minutes: number;
  price: number | null;
  requires_qualification: boolean;
  is_active: boolean;
}

export function usePhorestServices(locationId?: string) {
  return useQuery({
    queryKey: ['phorest-services', locationId],
    queryFn: async () => {
      // First get the phorest_branch_id for this location if provided
      let phorestBranchId: string | null = null;
      
      if (locationId) {
        const { data: location } = await supabase
          .from('locations')
          .select('phorest_branch_id')
          .eq('id', locationId)
          .single();
        
        phorestBranchId = location?.phorest_branch_id || null;
      }

      let query = supabase
        .from('phorest_services')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('name');
      
      // Only filter by branch if we have a valid phorest_branch_id
      if (phorestBranchId) {
        query = query.eq('phorest_branch_id', phorestBranchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PhorestService[];
    },
    // Enable the query when we have a location selected
    enabled: !!locationId,
  });
}

export function useServicesByCategory(branchId?: string) {
  const { data: services, ...rest } = usePhorestServices(branchId);

  const grouped = services?.reduce((acc, service) => {
    const category = service.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, PhorestService[]>);

  return { data: grouped, services, ...rest };
}
