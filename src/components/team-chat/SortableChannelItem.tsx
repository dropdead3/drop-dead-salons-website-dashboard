import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Hash, MapPin, Lock, Users } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ChannelWithMembership } from '@/hooks/team-chat/useChatChannels';
import { getChannelDisplayName, getChannelAvatarUrl } from '@/hooks/team-chat/useChannelDisplayName';

const channelTypeIcons: Record<string, typeof Hash> = {
  public: Hash,
  private: Lock,
  location: MapPin,
  dm: Users,
  group_dm: Users,
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface SortableChannelItemProps {
  channel: ChannelWithMembership;
  isActive: boolean;
  onClick: () => void;
  unreadCount: number;
  isDragEnabled?: boolean;
}

export function SortableChannelItem({ 
  channel, 
  isActive, 
  onClick, 
  unreadCount,
  isDragEnabled = true,
}: SortableChannelItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: channel.id,
    disabled: !isDragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = channelTypeIcons[channel.type] || Hash;
  const isMember = !!channel.membership;
  const isDM = channel.type === 'dm' || channel.type === 'group_dm';
  const avatarUrl = getChannelAvatarUrl(channel);
  const displayName = getChannelDisplayName(channel);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center',
        isDragging && 'opacity-50 z-50'
      )}
    >
      {isDragEnabled && (
        <button
          {...attributes}
          {...listeners}
          className="p-1 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
      <button
        onClick={onClick}
        className={cn(
          'flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
          'hover:bg-accent/50',
          isActive && 'bg-accent text-accent-foreground',
          !isMember && 'opacity-60',
          unreadCount > 0 && !isActive && 'font-semibold',
          !isDragEnabled && 'px-3'
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
    </div>
  );
}
