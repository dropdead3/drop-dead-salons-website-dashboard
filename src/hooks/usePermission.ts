import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

/**
 * Hook for checking user permissions in components.
 * Use this to conditionally render features based on permissions.
 * 
 * @example
 * // Check single permission
 * const { can } = usePermission();
 * if (can('team.manage')) { ... }
 * 
 * @example
 * // Check if user has any of the permissions
 * const { canAny } = usePermission();
 * if (canAny(['team.manage', 'team.view'])) { ... }
 * 
 * @example
 * // Check if user has all permissions
 * const { canAll } = usePermission();
 * if (canAll(['team.manage', 'announcements.manage'])) { ... }
 * 
 * @example
 * // Conditional rendering
 * const { can } = usePermission();
 * return can('settings.manage') ? <SettingsButton /> : null;
 */
export function usePermission() {
  const { hasPermission, hasAnyPermission, hasAllPermissions, permissions, loading } = useAuth();

  return {
    /** Check if user has a specific permission */
    can: hasPermission,
    /** Check if user has any of the specified permissions */
    canAny: hasAnyPermission,
    /** Check if user has all of the specified permissions */
    canAll: hasAllPermissions,
    /** List of all permissions the user has */
    permissions,
    /** Whether permissions are still loading */
    loading,
  };
}

/**
 * Component wrapper for permission-based rendering.
 * Renders children only if user has the required permission.
 */
interface PermissionGateProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { can } = usePermission();
  return can(permission) ? children : fallback;
}

/**
 * Component wrapper for rendering if user has ANY of the permissions.
 */
interface AnyPermissionGateProps {
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function AnyPermissionGate({ permissions, children, fallback = null }: AnyPermissionGateProps) {
  const { canAny } = usePermission();
  return canAny(permissions) ? children : fallback;
}

/**
 * Component wrapper for rendering if user has ALL of the permissions.
 */
interface AllPermissionsGateProps {
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function AllPermissionsGate({ permissions, children, fallback = null }: AllPermissionsGateProps) {
  const { canAll } = usePermission();
  return canAll(permissions) ? children : fallback;
}
