import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TeamChatContainer } from '@/components/team-chat';
import { PlatformPresenceProvider } from '@/contexts/PlatformPresenceContext';

export default function TeamChat() {
  return (
    <DashboardLayout>
      <PlatformPresenceProvider>
        <div className="h-[calc(100vh-4rem)]">
          <TeamChatContainer />
        </div>
      </PlatformPresenceProvider>
    </DashboardLayout>
  );
}
