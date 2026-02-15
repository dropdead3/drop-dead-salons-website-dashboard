import { useParams, Outlet } from 'react-router-dom';
import { useOrganizationBySlug } from '@/hooks/useOrganizations';
import { PublicOrgProvider } from '@/contexts/PublicOrgContext';
import { Loader2 } from 'lucide-react';
import NotFound from '@/pages/NotFound';

/**
 * Wrapper route component for /org/:orgSlug/*.
 * Loads the organization by slug and provides it via PublicOrgContext.
 * Renders <Outlet /> for nested routes.
 */
export function OrgPublicRoute() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { data: organization, isLoading, error } = useOrganizationBySlug(orgSlug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !organization || !orgSlug) {
    return <NotFound />;
  }

  return (
    <PublicOrgProvider organization={organization} orgSlug={orgSlug}>
      <Outlet />
    </PublicOrgProvider>
  );
}
