import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Organization } from '@/hooks/useOrganizations';

export interface UserOrganization extends Organization {
  /** Role within this org: 'primary' for employee_profiles org, or role from organization_admins */
  membershipRole: 'primary' | 'owner' | 'admin' | string;
  /** Whether this is the user's primary/home organization */
  isPrimary: boolean;
}

/**
 * Fetches all organizations a user has access to.
 * Combines:
 * - Primary org from employee_profiles (where they work day-to-day)
 * - Additional orgs from organization_admins (ownership/admin access)
 */
export function useUserOrganizations() {
  const { user, isPlatformUser } = useAuth();
  
  return useQuery({
    queryKey: ['user-organizations', user?.id],
    queryFn: async (): Promise<UserOrganization[]> => {
      if (!user?.id) return [];

      const allOrgs = new Map<string, UserOrganization>();

      // 1. Get primary org from employee profile
      const { data: profile, error: profileError } = await supabase
        .from('employee_profiles')
        .select(`
          organization_id,
          organizations:organization_id (*)
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile org:', profileError);
      }

      if (profile?.organizations && profile.organization_id) {
        const org = profile.organizations as unknown as Organization;
        allOrgs.set(profile.organization_id, {
          ...org,
          membershipRole: 'primary',
          isPrimary: true,
        });
      }

      // 2. Get additional orgs from organization_admins
      const { data: adminOrgs, error: adminError } = await supabase
        .from('organization_admins')
        .select(`
          organization_id,
          role,
          organizations:organization_id (*)
        `)
        .eq('user_id', user.id);

      if (adminError) {
        console.error('Error fetching admin orgs:', adminError);
      }

      adminOrgs?.forEach(ao => {
        if (ao.organizations && ao.organization_id) {
          const org = ao.organizations as unknown as Organization;
          // Only add if not already present (primary org takes precedence)
          if (!allOrgs.has(ao.organization_id)) {
            allOrgs.set(ao.organization_id, {
              ...org,
              membershipRole: ao.role || 'admin',
              isPrimary: false,
            });
          }
        }
      });

      return Array.from(allOrgs.values());
    },
    enabled: !!user?.id && !isPlatformUser, // Platform users use different switcher
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Returns whether the current user has access to multiple organizations.
 */
export function useIsMultiOrgUser(): boolean {
  const { data: orgs } = useUserOrganizations();
  return (orgs?.length ?? 0) > 1;
}

/**
 * Mutation to persist the user's active organization selection.
 */
export function useSetActiveOrganization() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      if (!user?.id) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('employee_profiles')
        .update({ active_organization_id: organizationId })
        .eq('user_id', user.id);

      if (error) throw error;

      // Log the org switch for audit
      await supabase.from('platform_audit_log').insert({
        user_id: user.id,
        organization_id: organizationId,
        action: 'org_context_switch',
        entity_type: 'organization',
        entity_id: organizationId,
        details: {
          user_type: 'owner',
          switch_type: 'multi_org_owner',
        },
      });

      return organizationId;
    },
    onSuccess: (newOrgId) => {
      // Invalidate queries that depend on organization
      queryClient.invalidateQueries({ queryKey: ['user-organization'] });
      queryClient.invalidateQueries({ queryKey: ['user-organizations'] });
    },
  });
}

/**
 * Fetches the user's persisted active organization preference.
 */
export function useActiveOrganizationPreference() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-organization-preference', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('employee_profiles')
        .select('active_organization_id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching active org preference:', error);
        return null;
      }

      return data?.active_organization_id;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}
