import { useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TeamChatContainer } from '@/components/team-chat';
import { PlatformPresenceProvider } from '@/contexts/PlatformPresenceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useOrganizations } from '@/hooks/useOrganizations';

export default function TeamChat() {
  const { isPlatformUser } = useAuth();
  const { effectiveOrganization, setSelectedOrganization } = useOrganizationContext();
  const { data: organizations } = useOrganizations();

  // Auto-select first organization for platform users if none selected
  useEffect(() => {
    if (isPlatformUser && !effectiveOrganization && organizations?.length > 0) {
      // Use first available organization instead of hardcoded default
      setSelectedOrganization(organizations[0]);
    }
  }, [isPlatformUser, effectiveOrganization, organizations, setSelectedOrganization]);

  return (
    <DashboardLayout hideFooter>
      <PlatformPresenceProvider>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <TeamChatContainer />
        </div>
      </PlatformPresenceProvider>
    </DashboardLayout>
  );
}
