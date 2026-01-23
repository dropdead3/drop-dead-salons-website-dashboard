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

export function usePhorestServices(branchId?: string) {
  return useQuery({
    queryKey: ['phorest-services', branchId],
    queryFn: async () => {
      let query = supabase
        .from('phorest_services')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('name');
      
      if (branchId) {
        query = query.eq('phorest_branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PhorestService[];
    },
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
