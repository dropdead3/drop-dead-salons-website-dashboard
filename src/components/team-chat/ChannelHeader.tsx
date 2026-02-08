import { Hash, MapPin, Lock, Users, Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTeamChatContext } from '@/contexts/TeamChatContext';
import { usePlatformPresenceContext } from '@/contexts/PlatformPresenceContext';

const channelTypeIcons: Record<string, typeof Hash> = {
  public: Hash,
  private: Lock,
  location: MapPin,
  dm: Users,
  group_dm: Users,
};

export function ChannelHeader() {
  const { activeChannel, toggleSidebar, isSidebarOpen } = useTeamChatContext();
  const { onlineCount } = usePlatformPresenceContext();

  if (!activeChannel) {
    return (
      <div className="h-14 border-b flex items-center px-4">
        <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-muted-foreground">Select a channel</span>
      </div>
    );
  }

  const Icon = channelTypeIcons[activeChannel.type] || Hash;

  return (
    <div className="h-14 border-b flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-semibold">{activeChannel.name}</h1>
        </div>

        {activeChannel.description && (
          <span className="hidden md:inline text-sm text-muted-foreground border-l pl-3 ml-1">
            {activeChannel.description}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{onlineCount} online</span>
        </div>

        <Button variant="ghost" size="icon">
          <Users className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
