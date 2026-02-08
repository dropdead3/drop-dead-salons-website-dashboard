import { TeamChatContainer } from '@/components/team-chat';
import { PlatformPresenceProvider } from '@/contexts/PlatformPresenceContext';

export default function TeamChat() {
  return (
    <PlatformPresenceProvider>
      <div className="h-[calc(100vh-4rem)]">
        <TeamChatContainer />
      </div>
    </PlatformPresenceProvider>
  );
}
