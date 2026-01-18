import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export const ALL_ROLES: AppRole[] = ['admin', 'manager', 'stylist', 'receptionist', 'assistant'];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  stylist: 'Stylist',
  receptionist: 'Receptionist',
  assistant: 'Assistant',
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: 'Full access to all features and settings',
  manager: 'Can manage team, view reports, and approve requests',
  stylist: 'Access to stylist features and 75 Hard program',
  receptionist: 'Front desk and scheduling access',
  assistant: 'Can be assigned to help stylists',
};

interface UserWithRoles {
  user_id: string;
  full_name: string;
  display_name: string | null;
  email: string | null;
  photo_url: string | null;
  roles: AppRole[];
}

export function useAllUsersWithRoles() {
  return useQuery({
    queryKey: ['all-users-with-roles'],
    queryFn: async () => {
      // Get all active employee profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('employee_profiles')
        .select('user_id, full_name, display_name, email, photo_url')
        .eq('is_active', true)
        .order('full_name');

      if (profilesError) throw profilesError;

      // Get all roles
      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Map roles to users
      const rolesMap = new Map<string, AppRole[]>();
      rolesData?.forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        rolesMap.set(r.user_id, [...existing, r.role as AppRole]);
      });

      return (profiles || []).map(profile => ({
        ...profile,
        roles: rolesMap.get(profile.user_id) || [],
      })) as UserWithRoles[];
    },
  });
}

export function useToggleUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role, hasRole }: { userId: string; role: AppRole; hasRole: boolean }) => {
      if (hasRole) {
        // Remove role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);

        if (error) {
          if (error.message?.includes('row-level security')) {
            if (role === 'admin') {
              throw new Error('Only Super Admins can remove the Admin role. Request approval from account owner.');
            }
            throw new Error('Permission denied');
          }
          throw error;
        }
      } else {
        // Add role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (error) {
          if (error.code === '23505') {
            // Duplicate key - role already exists
            return;
          }
          if (error.message?.includes('row-level security')) {
            if (role === 'admin') {
              throw new Error('Only Super Admins can assign the Admin role. Request approval from account owner.');
            }
            throw new Error('Permission denied');
          }
          throw error;
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['all-users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['team-directory'] });
      queryClient.invalidateQueries({ queryKey: ['account-approvals'] });
      toast.success(
        variables.hasRole 
          ? `${ROLE_LABELS[variables.role]} role removed` 
          : `${ROLE_LABELS[variables.role]} role added`
      );
    },
    onError: (error: Error) => {
      console.error('Error toggling role:', error);
      toast.error('Failed to update role', { 
        description: error.message || 'An error occurred'
      });
    },
  });
}
