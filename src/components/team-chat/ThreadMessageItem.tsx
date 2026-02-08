import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Smile, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { MessageWithSender } from '@/hooks/team-chat/useChatMessages';
import { EmojiPickerPopover } from './EmojiPickerPopover';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

interface ThreadMessageItemProps {
  message: MessageWithSender;
  onReact: (emoji: string) => void;
  isParent?: boolean;
}

export function ThreadMessageItem({ message, onReact, isParent }: ThreadMessageItemProps) {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);

  const senderName = message.sender?.display_name || message.sender?.full_name || 'Unknown';
  const initials = senderName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const timestamp = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });

  return (
    <div
      className={cn(
        'group relative flex gap-3 rounded-md transition-colors',
        !isParent && 'hover:bg-accent/30 p-2'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Avatar className={cn(isParent ? 'h-10 w-10' : 'h-8 w-8')}>
        <AvatarImage src={message.sender?.photo_url || undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className={cn('font-semibold', isParent ? 'text-sm' : 'text-xs')}>{senderName}</span>
          <span className="text-[10px] text-muted-foreground">{timestamp}</span>
          {message.is_edited && (
            <span className="text-[10px] text-muted-foreground">(edited)</span>
          )}
        </div>

        <div className={cn('whitespace-pre-wrap break-words', isParent ? 'text-sm' : 'text-xs')}>
          {message.content}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => onReact(reaction.emoji)}
                className={cn(
                  'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px]',
                  'bg-accent/50 hover:bg-accent transition-colors',
                  reaction.users.includes(user?.id || '') && 'ring-1 ring-primary'
                )}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      {showActions && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100"
            >
              <Smile className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="end">
            <div className="flex gap-1">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onReact(emoji)}
                  className="text-lg hover:scale-125 transition-transform p-0.5"
                >
                  {emoji}
                </button>
              ))}
              <EmojiPickerPopover onEmojiSelect={onReact} side="right">
                <button className="text-base hover:scale-110 transition-transform p-0.5 text-muted-foreground hover:text-foreground">
                  <Plus className="h-3 w-3" />
                </button>
              </EmojiPickerPopover>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
