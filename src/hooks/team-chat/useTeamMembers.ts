import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface TeamMember {
  userId: string;
  displayName: string | null;
  fullName: string | null;
  photoUrl: string | null;
  email: string | null;
}

export function useTeamMembers(
  searchQuery: string = '',
  locationId?: string,
  roleFilter?: AppRole | 'all'
) {
  const { user } = useAuth();
  const { effectiveOrganization } = useOrganizationContext();

  const { data: members, isLoading } = useQuery({
    queryKey: ['team-members', effectiveOrganization?.id, searchQuery, locationId, roleFilter],
    queryFn: async () => {
      if (!user?.id || !effectiveOrganization?.id) return [];

      // If role filter is set, first get matching user_ids from user_roles
      let roleFilteredUserIds: string[] | null = null;
      if (roleFilter && roleFilter !== 'all') {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', roleFilter);
        
        if (roleError) throw roleError;
        roleFilteredUserIds = roleData?.map(r => r.user_id) || [];
        
        // If no users have this role, return empty
        if (roleFilteredUserIds.length === 0) return [];
      }

      let query = supabase
        .from('employee_profiles')
        .select('user_id, display_name, full_name, photo_url, email, location_id')
        .eq('organization_id', effectiveOrganization.id)
        .eq('is_active', true)
        .eq('is_approved', true)
        .neq('user_id', user.id); // Exclude current user

      // Apply location filter
      if (locationId && locationId !== 'all') {
        query = query.eq('location_id', locationId);
      }

      // Apply role filter (user_ids from user_roles)
      if (roleFilteredUserIds) {
        query = query.in('user_id', roleFilteredUserIds);
      }

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
