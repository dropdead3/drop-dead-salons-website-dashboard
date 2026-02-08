import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

export interface TeamMember {
  userId: string;
  displayName: string | null;
  fullName: string | null;
  photoUrl: string | null;
  email: string | null;
}

export function useTeamMembers(searchQuery: string = '') {
  const { user } = useAuth();
  const { effectiveOrganization } = useOrganizationContext();

  const { data: members, isLoading } = useQuery({
    queryKey: ['team-members', effectiveOrganization?.id, searchQuery],
    queryFn: async () => {
      if (!user?.id || !effectiveOrganization?.id) return [];

      let query = supabase
        .from('employee_profiles')
        .select('user_id, display_name, full_name, photo_url, email')
        .eq('organization_id', effectiveOrganization.id)
        .eq('is_active', true)
        .eq('is_approved', true)
        .neq('user_id', user.id); // Exclude current user

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;

      return data?.map((m) => ({
        userId: m.user_id,
        displayName: m.display_name,
        fullName: m.full_name,
        photoUrl: m.photo_url,
        email: m.email,
      })) as TeamMember[];
    },
    enabled: !!user?.id && !!effectiveOrganization?.id,
  });

  return {
    members: members ?? [],
    isLoading,
  };
}
