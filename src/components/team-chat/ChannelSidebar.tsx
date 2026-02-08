import { useState } from 'react';
import { Hash, MapPin, Lock, Plus, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useChatChannels, useInitializeDefaultChannels, type ChannelWithMembership } from '@/hooks/team-chat/useChatChannels';
import { useTeamChatContext } from '@/contexts/TeamChatContext';
import { CreateChannelDialog } from './CreateChannelDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useEffect } from 'react';

const channelTypeIcons: Record<string, typeof Hash> = {
  public: Hash,
  private: Lock,
  location: MapPin,
  dm: Users,
  group_dm: Users,
};

interface ChannelItemProps {
  channel: ChannelWithMembership;
  isActive: boolean;
  onClick: () => void;
}

function ChannelItem({ channel, isActive, onClick }: ChannelItemProps) {
  const Icon = channelTypeIcons[channel.type] || Hash;
  const isMember = !!channel.membership;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
        'hover:bg-accent/50',
        isActive && 'bg-accent text-accent-foreground font-medium',
        !isMember && 'opacity-60'
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{channel.name}</span>
      {channel.membership?.is_muted && (
        <span className="ml-auto text-xs text-muted-foreground">muted</span>
      )}
    </button>
  );
}

export function ChannelSidebar() {
  const { channels, isLoading, joinChannel } = useChatChannels();
  const { activeChannel, setActiveChannel } = useTeamChatContext();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({
    channels: true,
    locations: true,
    direct: true,
  });

  const initializeChannels = useInitializeDefaultChannels();

  // Initialize default channels on first load if none exist
  useEffect(() => {
    if (!isLoading && channels.length === 0) {
      initializeChannels.mutate();
    }
  }, [isLoading, channels.length]);

  // Auto-select first channel
  useEffect(() => {
    if (!activeChannel && channels.length > 0) {
      const generalChannel = channels.find((c) => c.name === 'general');
      setActiveChannel(generalChannel || channels[0]);
    }
  }, [channels, activeChannel, setActiveChannel]);

  const publicChannels = channels.filter((c) => c.type === 'public' || c.type === 'private');
  const locationChannels = channels.filter((c) => c.type === 'location');
  const dmChannels = channels.filter((c) => c.type === 'dm' || c.type === 'group_dm');

  const handleChannelClick = (channel: ChannelWithMembership) => {
    // Join if not a member
    if (!channel.membership && (channel.type === 'public' || channel.type === 'location')) {
      joinChannel(channel.id);
    }
    setActiveChannel(channel);
  };

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="flex flex-col h-full bg-sidebar border-r">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Team Chat</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {/* Public/Private Channels */}
          <Collapsible open={sectionsOpen.channels} onOpenChange={() => toggleSection('channels')}>
            <div className="flex items-center justify-between px-2">
              <CollapsibleTrigger className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground">
                {sectionsOpen.channels ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Channels
              </CollapsibleTrigger>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <CollapsibleContent className="mt-1 space-y-0.5">
              {publicChannels.map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  isActive={activeChannel?.id === channel.id}
                  onClick={() => handleChannelClick(channel)}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Location Channels */}
          {locationChannels.length > 0 && (
            <Collapsible open={sectionsOpen.locations} onOpenChange={() => toggleSection('locations')}>
              <CollapsibleTrigger className="flex items-center gap-1 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground">
                {sectionsOpen.locations ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Locations
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-0.5">
                {locationChannels.map((channel) => (
                  <ChannelItem
                    key={channel.id}
                    channel={channel}
                    isActive={activeChannel?.id === channel.id}
                    onClick={() => handleChannelClick(channel)}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Direct Messages */}
          {dmChannels.length > 0 && (
            <Collapsible open={sectionsOpen.direct} onOpenChange={() => toggleSection('direct')}>
              <div className="flex items-center justify-between px-2">
                <CollapsibleTrigger className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground">
                  {sectionsOpen.direct ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  Direct Messages
                </CollapsibleTrigger>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <CollapsibleContent className="mt-1 space-y-0.5">
                {dmChannels.map((channel) => (
                  <ChannelItem
                    key={channel.id}
                    channel={channel}
                    isActive={activeChannel?.id === channel.id}
                    onClick={() => handleChannelClick(channel)}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </ScrollArea>

      <CreateChannelDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
