import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PlatformRole = 'platform_owner' | 'platform_admin' | 'platform_support' | 'platform_developer';

interface PlatformRoleRecord {
  id: string;
  user_id: string;
  role: PlatformRole;
  created_at: string;
  granted_by: string | null;
}

interface PlatformTeamMember {
  id: string;
  user_id: string;
  role: PlatformRole;
  created_at: string;
  granted_by: string | null;
  email?: string;
  full_name?: string;
}

export function usePlatformRoles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['platform-roles', user?.id],
    queryFn: async (): Promise<PlatformRole[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('platform_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching platform roles:', error);
        return [];
      }

      return (data?.map(r => r.role) || []) as PlatformRole[];
    },
    enabled: !!user?.id,
  });
}

export function usePlatformTeam() {
  return useQuery({
    queryKey: ['platform-team'],
    queryFn: async (): Promise<PlatformTeamMember[]> => {
      const { data, error } = await supabase
        .from('platform_roles')
        .select(`
          id,
          user_id,
          role,
          created_at,
          granted_by
        `)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching platform team:', error);
        return [];
      }

      // Fetch user emails from employee_profiles
      const userIds = data?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from('employee_profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map(record => ({
        ...record,
        role: record.role as PlatformRole,
        email: profileMap.get(record.user_id)?.email,
        full_name: profileMap.get(record.user_id)?.full_name,
      }));
    },
  });
}

export function useAddPlatformRole() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: PlatformRole }) => {
      const { data, error } = await supabase
        .from('platform_roles')
        .insert({
          user_id: userId,
          role,
          granted_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-team'] });
      queryClient.invalidateQueries({ queryKey: ['platform-roles'] });
    },
  });
}

export function useRemovePlatformRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: PlatformRole }) => {
      const { error } = await supabase
        .from('platform_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-team'] });
      queryClient.invalidateQueries({ queryKey: ['platform-roles'] });
    },
  });
}

export function useUpdatePlatformRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, oldRole, newRole }: { userId: string; oldRole: PlatformRole; newRole: PlatformRole }) => {
      const { error } = await supabase
        .from('platform_roles')
        .update({ role: newRole })
        .eq('user_id', userId)
        .eq('role', oldRole);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-team'] });
      queryClient.invalidateQueries({ queryKey: ['platform-roles'] });
    },
  });
}
