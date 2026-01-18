import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCoach?: boolean;
}

export function ProtectedRoute({ children, requireCoach = false }: ProtectedRouteProps) {
  const { user, loading, isCoach } = useAuth();
  const location = useLocation();

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

  if (requireCoach && !isCoach) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
