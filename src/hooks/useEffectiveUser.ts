import { useAuth } from '@/contexts/AuthContext';
import { useViewAs } from '@/contexts/ViewAsContext';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

/**
 * Returns the effective user ID for data fetching.
 * When a super admin is impersonating a specific user, returns that user's ID.
 * Otherwise returns the actual logged-in user's ID.
 */
export function useEffectiveUserId(): string | undefined {
  const { user } = useAuth();
  const { viewAsUser, isViewingAsUser } = useViewAs();
  
  if (isViewingAsUser && viewAsUser) {
    return viewAsUser.id;
  }
  
  return user?.id;
}

/**
 * Returns the actual logged-in user's ID, ignoring impersonation.
 * Use this for actions that should always be performed as the actual user
 * (e.g., audit logs, mutations that shouldn't affect impersonated user).
 */
export function useActualUserId(): string | undefined {
  const { user } = useAuth();
  return user?.id;
}

/**
 * Returns the effective roles for the current view context.
 * - When impersonating a specific user: returns that user's roles
 * - When viewing as a role: returns just that role
 * - Otherwise: returns the actual logged-in user's roles
 */
export function useEffectiveRoles(): AppRole[] {
  const { roles: authRoles } = useAuth();
  const { viewAsUser, isViewingAsUser, viewAsRole, isViewingAs } = useViewAs();
  
  // User-specific impersonation takes priority
  if (isViewingAsUser && viewAsUser?.roles) {
    return viewAsUser.roles;
  }
  
  // Role-based impersonation
  if (isViewingAs && viewAsRole) {
    return [viewAsRole];
  }
  
  return authRoles;
}

/**
 * Returns both the effective user ID and whether impersonation is active.
 * Useful for components that need to show different UI during impersonation.
 */
export function useEffectiveUserContext() {
  const { user } = useAuth();
  const { viewAsUser, isViewingAsUser, viewAsRole, isViewingAs } = useViewAs();
  
  return {
    effectiveUserId: isViewingAsUser && viewAsUser ? viewAsUser.id : user?.id,
    actualUserId: user?.id,
    isImpersonating: isViewingAsUser,
    impersonatedUser: viewAsUser,
    viewAsRole,
    isViewingAs,
  };
}
