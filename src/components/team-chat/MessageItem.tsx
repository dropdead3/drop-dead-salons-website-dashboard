import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, MessageSquare, Smile, Trash2, Pencil } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { MessageWithSender } from '@/hooks/team-chat/useChatMessages';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

interface MessageItemProps {
  message: MessageWithSender;
  isConsecutive: boolean;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onDelete: () => void;
}

export function MessageItem({ message, isConsecutive, onReact, onReply, onDelete }: MessageItemProps) {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const isOwn = message.sender_id === user?.id;

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
        'group relative flex gap-3 px-2 py-1 rounded-md transition-colors',
        'hover:bg-accent/30',
        isConsecutive && 'pt-0'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar or timestamp spacer */}
      <div className="w-10 shrink-0">
        {!isConsecutive && (
          <Avatar className="h-10 w-10">
            <AvatarImage src={message.sender?.photo_url || undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        )}
        {isConsecutive && showActions && (
          <span className="text-[10px] text-muted-foreground">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {!isConsecutive && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-semibold text-sm">{senderName}</span>
            <span className="text-xs text-muted-foreground">{timestamp}</span>
            {message.is_edited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>
        )}

        <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => onReact(reaction.emoji)}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
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

        {/* Reply count */}
        {message.reply_count && message.reply_count > 0 && (
          <button
            onClick={onReply}
            className="flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
          >
            <MessageSquare className="h-3 w-3" />
            {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {/* Hover actions */}
      {showActions && (
        <div className="absolute right-2 top-0 -translate-y-1/2 flex items-center gap-0.5 bg-background border rounded-md shadow-sm p-0.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end">
              <div className="flex gap-1">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onReact(emoji)}
                    className="text-xl hover:scale-125 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onReply}>
            <MessageSquare className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwn && (
                <DropdownMenuItem>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit message
                </DropdownMenuItem>
              )}
              {isOwn && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete message
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
