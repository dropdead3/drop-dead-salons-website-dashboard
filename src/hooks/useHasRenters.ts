import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

export function useHasRenters() {
  const { effectiveOrganization } = useOrganizationContext();
  const orgId = effectiveOrganization?.id;

  return useQuery({
    queryKey: ['has-renters', orgId],
    queryFn: async () => {
      // Check for any booth_renter_profiles
      const { count: renterCount, error: renterError } = await supabase
        .from('booth_renter_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId!);

      if (renterError) throw renterError;
      if ((renterCount ?? 0) > 0) return true;

      // Check if any location offers rentals
      const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('rental_model')
        .eq('organization_id', orgId!)
        .neq('rental_model', 'none');

      if (locError) throw locError;
      return (locations?.length ?? 0) > 0;
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
    select: (data) => data,
  });
}
