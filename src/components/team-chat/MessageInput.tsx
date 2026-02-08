import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send, Paperclip, Smile, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useChatMessages } from '@/hooks/team-chat/useChatMessages';
import { useTeamChatContext } from '@/contexts/TeamChatContext';

export function MessageInput() {
  const { activeChannel } = useTeamChatContext();
  const { sendMessage, isSending } = useChatMessages(activeChannel?.id || null);
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (!content.trim() || isSending || !activeChannel?.membership) return;

    sendMessage(content.trim());
    setContent('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [content, isSending, sendMessage, activeChannel?.membership]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  if (!activeChannel) return null;

  const canSend = !!activeChannel.membership;

  return (
    <div className="border-t p-4">
      <div
        className={cn(
          'flex items-end gap-2 rounded-lg border bg-background p-2',
          !canSend && 'opacity-60'
        )}
      >
        <Button variant="ghost" size="icon" className="shrink-0" disabled={!canSend}>
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={
              canSend
                ? `Message #${activeChannel.name}`
                : `Join #${activeChannel.name} to send messages`
            }
            disabled={!canSend}
            className="min-h-[40px] max-h-[200px] resize-none border-0 focus-visible:ring-0 p-2"
            rows={1}
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" disabled={!canSend}>
            <AtSign className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" disabled={!canSend}>
            <Smile className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!content.trim() || isSending || !canSend}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {!canSend && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Click on the channel to join and start sending messages
        </p>
      )}
    </div>
  );
}
