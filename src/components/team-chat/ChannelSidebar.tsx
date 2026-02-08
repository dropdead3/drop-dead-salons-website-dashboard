import { useState, useEffect, useRef, useMemo } from 'react';
import { Hash, MapPin, Lock, Plus, ChevronDown, ChevronRight, Users, Settings, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useChatChannels, useInitializeDefaultChannels, type ChannelWithMembership } from '@/hooks/team-chat/useChatChannels';
import { getChannelDisplayName } from '@/hooks/team-chat/useChannelDisplayName';
import { useAutoJoinLocationChannels } from '@/hooks/team-chat/useAutoJoinLocationChannels';
import { useUnreadMessages } from '@/hooks/team-chat/useUnreadMessages';
import { useTeamChatContext } from '@/contexts/TeamChatContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { CreateChannelDialog } from './CreateChannelDialog';
import { StartDMDialog } from './StartDMDialog';
import { TeamChatAdminSettingsSheet } from './TeamChatAdminSettingsSheet';
import { AIChatPanel } from './AIChatPanel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

// Role priority for sorting DMs (lower = higher priority)
const ROLE_PRIORITY: Record<string, number> = {
  super_admin: 1,
  admin: 2,
  manager: 3,
  stylist: 4,
  receptionist: 5,
  stylist_assistant: 6,
  admin_assistant: 7,
  operations_assistant: 8,
  booth_renter: 9,
  bookkeeper: 10,
  assistant: 11,
};

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
  unreadCount: number;
}

function ChannelItem({ channel, isActive, onClick, unreadCount }: ChannelItemProps) {
  const Icon = channelTypeIcons[channel.type] || Hash;
  const isMember = !!channel.membership;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
        'hover:bg-accent/50',
        isActive && 'bg-accent text-accent-foreground',
        !isMember && 'opacity-60',
        unreadCount > 0 && !isActive && 'font-semibold'
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate flex-1 text-left">{getChannelDisplayName(channel)}</span>
      {unreadCount > 0 && !isActive && (
        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px]">
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
      {channel.membership?.is_muted && unreadCount === 0 && (
        <span className="text-xs text-muted-foreground">muted</span>
      )}
    </button>
  );
}

export function ChannelSidebar() {
  const { channels, isLoading, joinChannel } = useChatChannels();
  const { activeChannel, setActiveChannel } = useTeamChatContext();
  const { effectiveOrganization } = useOrganizationContext();
  const { data: profile } = useEmployeeProfile();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDMOpen, setIsDMOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({
    channels: true,
    locations: true,
    direct: true,
  });

  // Only super admins can access settings
  const canAccessSettings = profile?.is_super_admin === true;
  
  // Check if organization is multi-location
  const isMultiLocation = effectiveOrganization?.is_multi_location ?? true;

  const channelIds = channels.map((c) => c.id);
  const { getUnreadCount, markAsRead } = useUnreadMessages(channelIds);

  const initializeChannels = useInitializeDefaultChannels();
  const autoJoinChannels = useAutoJoinLocationChannels();
  const hasAutoJoined = useRef(false);
  const hasInitialized = useRef(false);

  // Initialize default channels on first load if none exist
  useEffect(() => {
    if (!isLoading && channels.length === 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      initializeChannels.mutate();
    }
  }, [isLoading, channels.length]);

  // Auto-join user to appropriate channels based on their profile
  useEffect(() => {
    if (!isLoading && channels.length > 0 && !hasAutoJoined.current) {
      hasAutoJoined.current = true;
      autoJoinChannels.mutate();
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
  
  // Sort DM channels by role hierarchy
  const sortedDmChannels = useMemo(() => {
    const dms = channels.filter((c) => c.type === 'dm' || c.type === 'group_dm');
    return dms.sort((a, b) => {
      // Get highest priority role for each partner
      const getRolePriority = (roles: string[] | undefined) => {
        if (!roles || roles.length === 0) return 99;
        return Math.min(...roles.map((r) => ROLE_PRIORITY[r] ?? 99));
      };
      
      const priorityA = getRolePriority(a.dm_partner?.roles);
      const priorityB = getRolePriority(b.dm_partner?.roles);
      
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      // Secondary sort: alphabetical by name
      const nameA = a.dm_partner?.display_name || '';
      const nameB = b.dm_partner?.display_name || '';
      return nameA.localeCompare(nameB);
    });
  }, [channels]);

  const handleChannelClick = (channel: ChannelWithMembership) => {
    // Join if not a member
    if (!channel.membership && (channel.type === 'public' || channel.type === 'location')) {
      joinChannel(channel.id);
    }
    setActiveChannel(channel);
    // Mark as read when channel is selected
    if (channel.membership) {
      markAsRead(channel.id);
    }
  };

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="flex flex-col h-full bg-sidebar border-r">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg">Team Chat</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsAIChatOpen(true)}
            title="AI Assistant"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
          {canAccessSettings && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsSettingsOpen(true)}
              title="Team Chat Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
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
                  unreadCount={getUnreadCount(channel.id)}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Location Channels - Only show for multi-location organizations */}
          {isMultiLocation && locationChannels.length > 0 && (
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
                    unreadCount={getUnreadCount(channel.id)}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Direct Messages - Always show section */}
          <Collapsible open={sectionsOpen.direct} onOpenChange={() => toggleSection('direct')}>
            <div className="flex items-center justify-between px-2">
              <CollapsibleTrigger className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground">
                {sectionsOpen.direct ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Direct Messages
              </CollapsibleTrigger>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsDMOpen(true)}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <CollapsibleContent className="mt-1 space-y-0.5">
              {sortedDmChannels.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3 py-2">
                  Click + to start a conversation
                </p>
              ) : (
                sortedDmChannels.map((channel) => (
                  <ChannelItem
                    key={channel.id}
                    channel={channel}
                    isActive={activeChannel?.id === channel.id}
                    onClick={() => handleChannelClick(channel)}
                    unreadCount={getUnreadCount(channel.id)}
                  />
                ))
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      <CreateChannelDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <StartDMDialog open={isDMOpen} onOpenChange={setIsDMOpen} />
      <TeamChatAdminSettingsSheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <AIChatPanel open={isAIChatOpen} onOpenChange={setIsAIChatOpen} />
    </div>
  );
}
