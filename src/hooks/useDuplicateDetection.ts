import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

interface DuplicateResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  mobile: string | null;
  last_visit_date: string | null;
  total_spend: number | null;
  match_type: string;
}

export function useDuplicateDetection(
  email: string | null | undefined,
  phone: string | null | undefined,
  excludeClientId?: string
) {
  const { effectiveOrganization } = useOrganizationContext();

  return useQuery({
    queryKey: ['duplicate-detection', email, phone, excludeClientId, effectiveOrganization?.id],
    queryFn: async (): Promise<DuplicateResult[]> => {
      if (!effectiveOrganization?.id) return [];

      const { data, error } = await supabase.rpc('find_duplicate_clients', {
        p_organization_id: effectiveOrganization.id,
        p_email: email || null,
        p_phone: phone || null,
        p_exclude_client_id: excludeClientId || null,
      });

      if (error) {
        console.error('Duplicate detection error:', error);
        return [];
      }

      return (data || []) as DuplicateResult[];
    },
    enabled: !!effectiveOrganization?.id && !!(email || phone),
    staleTime: 10_000, // 10 seconds
  });
}
