import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCoach?: boolean;
  requiredPermission?: string;
}

export function ProtectedRoute({ children, requireCoach = false, requiredPermission }: ProtectedRouteProps) {
  const { user, loading, isCoach, hasPermission, permissions, roles } = useAuth();
  const location = useLocation();

  // Show loading while auth or permissions are being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/staff-login" state={{ from: location }} replace />;
  }

  // Wait for roles to be loaded before checking permissions
  // If user exists but roles haven't loaded yet, show loading
  if (roles.length === 0 && requiredPermission) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  // Check permission-based access (only if permissions exist for the user's roles)
  if (requiredPermission && permissions.length > 0 && !hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Legacy coach check (fallback for routes without specific permissions)
  if (requireCoach && !isCoach) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
