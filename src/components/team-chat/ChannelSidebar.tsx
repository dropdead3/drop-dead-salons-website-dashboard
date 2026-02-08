import { useState, useEffect, useRef, useMemo } from 'react';
import { Hash, MapPin, Lock, Plus, ChevronDown, ChevronRight, Users, Settings, Sparkles, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useChatChannels, useInitializeDefaultChannels, type ChannelWithMembership } from '@/hooks/team-chat/useChatChannels';
import { getChannelDisplayName, getChannelAvatarUrl } from '@/hooks/team-chat/useChannelDisplayName';
import { useAutoJoinLocationChannels } from '@/hooks/team-chat/useAutoJoinLocationChannels';
import { useUnreadMessages } from '@/hooks/team-chat/useUnreadMessages';
import { useTeamChatContext } from '@/contexts/TeamChatContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useChatSections } from '@/hooks/team-chat/useChatSections';
import { useChatLayoutPreferences } from '@/hooks/team-chat/useChatLayoutPreferences';
import { useHasChatPermission, CHAT_PERMISSION_KEYS } from '@/hooks/team-chat/useChatPermissions';
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

// Helper to extract initials from a name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface ChannelItemProps {
  channel: ChannelWithMembership;
  isActive: boolean;
  onClick: () => void;
  unreadCount: number;
}

function ChannelItem({ channel, isActive, onClick, unreadCount }: ChannelItemProps) {
  const Icon = channelTypeIcons[channel.type] || Hash;
  const isMember = !!channel.membership;
  const isDM = channel.type === 'dm' || channel.type === 'group_dm';
  const avatarUrl = getChannelAvatarUrl(channel);
  const displayName = getChannelDisplayName(channel);

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
      {isDM ? (
        <Avatar className="h-5 w-5 shrink-0">
          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
          <AvatarFallback className="text-[10px] bg-muted">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <span className="truncate flex-1 text-left">{displayName}</span>
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

interface SidebarSectionProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onAddClick?: () => void;
  showAddButton?: boolean;
  children: React.ReactNode;
}

function SidebarSection({ 
  id, 
  title, 
  icon, 
  isOpen, 
  onToggle, 
  onAddClick, 
  showAddButton,
  children 
}: SidebarSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="flex items-center justify-between px-2">
        <CollapsibleTrigger className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {icon}
          {title}
        </CollapsibleTrigger>
        {showAddButton && onAddClick && (
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onAddClick}>
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
      <CollapsibleContent className="mt-1 space-y-0.5">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ChannelSidebar() {
  const { channels, isLoading, joinChannel } = useChatChannels();
  const { activeChannel, setActiveChannel } = useTeamChatContext();
  const { effectiveOrganization } = useOrganizationContext();
  const { data: profile } = useEmployeeProfile();
  const { sections } = useChatSections();
  const { isSectionCollapsed, toggleSectionCollapsed } = useChatLayoutPreferences();
  const canCreateChannel = useHasChatPermission(CHAT_PERMISSION_KEYS.CREATE_CHANNEL);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDMOpen, setIsDMOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  
  // Local state for section collapse (fallback + immediate UI)
  const [localCollapsed, setLocalCollapsed] = useState<Record<string, boolean>>({});

  // Only super admins can access settings
  const canAccessSettings = profile?.is_super_admin === true || profile?.is_primary_owner === true;
  
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

  // Group channels by section
  const channelsBySection = useMemo(() => {
    const result: Record<string, ChannelWithMembership[]> = {
      default: [],
      locations: [],
      direct: [],
    };

    // Initialize custom sections
    sections.forEach(s => {
      result[s.id] = [];
    });

    channels.forEach(channel => {
      if (channel.type === 'dm' || channel.type === 'group_dm') {
        result.direct.push(channel);
      } else if (channel.type === 'location') {
        result.locations.push(channel);
      } else if (channel.section_id && result[channel.section_id]) {
        result[channel.section_id].push(channel);
      } else {
        result.default.push(channel);
      }
    });

    return result;
  }, [channels, sections]);

  // Sort DM channels by role hierarchy
  const sortedDmChannels = useMemo(() => {
    const dms = channelsBySection.direct || [];
    return dms.sort((a, b) => {
      const getRolePriority = (roles: string[] | undefined) => {
        if (!roles || roles.length === 0) return 99;
        return Math.min(...roles.map((r) => ROLE_PRIORITY[r] ?? 99));
      };
      
      const priorityA = getRolePriority(a.dm_partner?.roles);
      const priorityB = getRolePriority(b.dm_partner?.roles);
      
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      const nameA = a.dm_partner?.display_name || '';
      const nameB = b.dm_partner?.display_name || '';
      return nameA.localeCompare(nameB);
    });
  }, [channelsBySection.direct]);

  const handleChannelClick = (channel: ChannelWithMembership) => {
    if (!channel.membership && (channel.type === 'public' || channel.type === 'location')) {
      joinChannel(channel.id);
    }
    setActiveChannel(channel);
    if (channel.membership) {
      markAsRead(channel.id);
    }
  };

  const isSectionOpen = (sectionId: string): boolean => {
    if (localCollapsed[sectionId] !== undefined) {
      return !localCollapsed[sectionId];
    }
    return !isSectionCollapsed(sectionId);
  };

  const handleToggleSection = (sectionId: string) => {
    setLocalCollapsed(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId] ? true : !prev[sectionId]
    }));
    toggleSectionCollapsed(sectionId);
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
          {/* Default Channels Section */}
          <SidebarSection
            id="default"
            title="Channels"
            isOpen={isSectionOpen('default')}
            onToggle={() => handleToggleSection('default')}
            showAddButton={canCreateChannel}
            onAddClick={() => setIsCreateOpen(true)}
          >
            {channelsBySection.default.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                isActive={activeChannel?.id === channel.id}
                onClick={() => handleChannelClick(channel)}
                unreadCount={getUnreadCount(channel.id)}
              />
            ))}
          </SidebarSection>

          {/* Custom Sections */}
          {sections.map((section) => (
            <SidebarSection
              key={section.id}
              id={section.id}
              title={section.name}
              icon={<Folder className="h-3 w-3 mr-1" />}
              isOpen={isSectionOpen(section.id)}
              onToggle={() => handleToggleSection(section.id)}
            >
              {(channelsBySection[section.id] || []).length === 0 ? (
                <p className="text-xs text-muted-foreground px-3 py-2">
                  No channels in this section
                </p>
              ) : (
                (channelsBySection[section.id] || []).map((channel) => (
                  <ChannelItem
                    key={channel.id}
                    channel={channel}
                    isActive={activeChannel?.id === channel.id}
                    onClick={() => handleChannelClick(channel)}
                    unreadCount={getUnreadCount(channel.id)}
                  />
                ))
              )}
            </SidebarSection>
          ))}

          {/* Location Channels */}
          {isMultiLocation && channelsBySection.locations.length > 0 && (
            <SidebarSection
              id="locations"
              title="Locations"
              isOpen={isSectionOpen('locations')}
              onToggle={() => handleToggleSection('locations')}
            >
              {channelsBySection.locations.map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  isActive={activeChannel?.id === channel.id}
                  onClick={() => handleChannelClick(channel)}
                  unreadCount={getUnreadCount(channel.id)}
                />
              ))}
            </SidebarSection>
          )}

          {/* Direct Messages */}
          <SidebarSection
            id="direct"
            title="Direct Messages"
            isOpen={isSectionOpen('direct')}
            onToggle={() => handleToggleSection('direct')}
            showAddButton
            onAddClick={() => setIsDMOpen(true)}
          >
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
          </SidebarSection>
        </div>
      </ScrollArea>

      <CreateChannelDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <StartDMDialog open={isDMOpen} onOpenChange={setIsDMOpen} />
      <TeamChatAdminSettingsSheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <AIChatPanel open={isAIChatOpen} onOpenChange={setIsAIChatOpen} />
    </div>
  );
}
