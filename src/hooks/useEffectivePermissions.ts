import { useAuth } from '@/contexts/AuthContext';
import { useViewAs } from '@/contexts/ViewAsContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

/**
 * Fetches permissions for a specific role from the database.
 */
async function fetchPermissionsForRole(role: AppRole): Promise<string[]> {
  const { data, error } = await supabase
    .from('role_permissions')
    .select(`
      permission_id,
      permissions:permission_id (
        name
      )
    `)
    .eq('role', role);

  if (error) {
    console.error('Error fetching permissions for role:', error);
    return [];
  }

  const permissionNames = new Set<string>();
  data?.forEach(rp => {
    if (rp.permissions && typeof rp.permissions === 'object' && 'name' in rp.permissions) {
      permissionNames.add((rp.permissions as { name: string }).name);
    }
  });

  return Array.from(permissionNames);
}

export interface EffectivePermissionsResult {
  permissions: string[];
  isLoading: boolean;
}

/**
 * Returns the effective permissions for the current view context.
 * - When viewing as a specific role: returns that role's permissions
 * - When viewing as a specific user: returns that user's roles' permissions
 * - Otherwise: returns the actual logged-in user's permissions
 *
 * `isLoading` is true only when in View As mode and the permissions query is in flight.
 */
export function useEffectivePermissions(): EffectivePermissionsResult {
  const { permissions: authPermissions } = useAuth();
  const { viewAsRole, viewAsUser, isViewingAs, isViewingAsUser } = useViewAs();

  // Query for role-based impersonation permissions
  const {
    data: rolePermissions = [],
    isLoading: rolePermissionsLoading,
  } = useQuery({
    queryKey: ['rolePermissions', viewAsRole],
    queryFn: () => fetchPermissionsForRole(viewAsRole!),
    enabled: isViewingAs && !!viewAsRole && !isViewingAsUser,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Query for user-based impersonation permissions (fetch permissions for all user's roles)
  const {
    data: userPermissions = [],
    isLoading: userPermissionsLoading,
  } = useQuery({
    queryKey: ['userPermissions', viewAsUser?.id, viewAsUser?.roles],
    queryFn: async () => {
      if (!viewAsUser?.roles?.length) return [];

      const allPermissions = new Set<string>();
      for (const role of viewAsUser.roles) {
        const perms = await fetchPermissionsForRole(role);
        perms.forEach(p => allPermissions.add(p));
      }
      return Array.from(allPermissions);
    },
    enabled: isViewingAsUser && !!viewAsUser?.roles?.length,
    staleTime: 5 * 60 * 1000,
  });

  // User-specific impersonation takes priority
  if (isViewingAsUser && viewAsUser?.roles) {
    return {
      permissions: userPermissions,
      isLoading: userPermissionsLoading,
    };
  }

  // Role-based impersonation
  if (isViewingAs && viewAsRole) {
    return {
      permissions: rolePermissions,
      isLoading: rolePermissionsLoading,
    };
  }

  // Default to actual permissions (no loading; from AuthContext)
  return {
    permissions: authPermissions,
    isLoading: false,
  };
}

/**
 * Hook to check if a specific permission is granted in the effective context.
 */
export function useHasEffectivePermission(permissionName: string): boolean {
  const { permissions } = useEffectivePermissions();
  return permissions.includes(permissionName);
}
