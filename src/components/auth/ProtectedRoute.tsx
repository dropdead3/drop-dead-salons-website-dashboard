import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useViewAs } from '@/contexts/ViewAsContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useEffectivePermissions } from '@/hooks/useEffectivePermissions';
import { AccessDeniedView } from './AccessDeniedView';
import { Loader2 } from 'lucide-react';

type PlatformRole = 'platform_owner' | 'platform_admin' | 'platform_support' | 'platform_developer';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCoach?: boolean;
  requiredPermission?: string;
  requireSuperAdmin?: boolean;
  requirePlatformRole?: PlatformRole;
  requireAnyPlatformRole?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireCoach = false, 
  requiredPermission, 
  requireSuperAdmin = false,
  requirePlatformRole,
  requireAnyPlatformRole = false,
}: ProtectedRouteProps) {
  const { user, loading, isCoach, hasPermission, permissions, roles, platformRoles, hasPlatformRoleOrHigher, isPlatformUser } = useAuth();
  const { isViewingAs, viewAsRole, clearViewAs } = useViewAs();
  const effectivePermissions = useEffectivePermissions();
  const { data: profile, isLoading: profileLoading } = useEmployeeProfile();
  const location = useLocation();

  // Show loading while auth or permissions are being fetched
  if (loading || (requireSuperAdmin && profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!user) {
    // Redirect to platform login if trying to access platform routes
    if (location.pathname.startsWith('/dashboard/platform')) {
      return <Navigate to="/platform-login" state={{ from: location }} replace />;
    }
    return <Navigate to="/staff-login" state={{ from: location }} replace />;
  }

  // Wait for roles to be loaded before checking permissions
  // If user exists but roles haven't loaded yet, show loading
  if (roles.length === 0 && requiredPermission && !isPlatformUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  // Check platform role requirements
  if (requireAnyPlatformRole && !isPlatformUser) {
    return <Navigate to="/platform-login" replace />;
  }

  if (requirePlatformRole && !hasPlatformRoleOrHigher(requirePlatformRole)) {
    return <Navigate to="/dashboard/platform/overview" replace />;
  }

  // Check super admin access
  if (requireSuperAdmin && !profile?.is_super_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check permission-based access (only if permissions exist for the user's roles)
  // Platform users bypass permission checks for platform routes
  // When in View As mode, use effective permissions for accurate simulation
  if (requiredPermission && !isPlatformUser) {
    const hasEffectivePermission = effectivePermissions.includes(requiredPermission);
    
    // In View As mode, show access denied view instead of redirecting
    if (isViewingAs && !hasEffectivePermission) {
      return (
        <AccessDeniedView 
          role={viewAsRole} 
          permission={requiredPermission}
          onExitViewAs={clearViewAs}
        />
      );
    }
    
    // For real users (not in View As mode), redirect if no permission
    if (!isViewingAs && permissions.length > 0 && !hasPermission(requiredPermission)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Legacy coach check (fallback for routes without specific permissions)
  if (requireCoach && !isCoach) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
