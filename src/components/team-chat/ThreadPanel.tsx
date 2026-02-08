import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useTeamChatContext } from '@/contexts/TeamChatContext';
import { useThreadMessages } from '@/hooks/team-chat/useThreadMessages';
import { ThreadMessageItem } from './ThreadMessageItem';
import { cn } from '@/lib/utils';

export function ThreadPanel() {
  const { threadMessageId, closeThread, activeChannel } = useTeamChatContext();
  const { parentMessage, replies, isLoading, sendReply, toggleReaction, isSending } = useThreadMessages(threadMessageId);
  const [replyContent, setReplyContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastReplyIdRef = useRef<string | null>(null);

  // Auto-scroll when new replies arrive
  useEffect(() => {
    if (replies.length > 0) {
      const lastReply = replies[replies.length - 1];
      if (lastReply.id !== lastReplyIdRef.current) {
        lastReplyIdRef.current = lastReply.id;
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [replies]);

  const handleSendReply = () => {
    if (!replyContent.trim() || isSending) return;
    sendReply(replyContent.trim());
    setReplyContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyContent(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  if (!threadMessageId) return null;

  return (
    <div className="w-80 lg:w-96 border-l flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        <div className="font-semibold">Thread</div>
        <Button variant="ghost" size="icon" onClick={closeThread}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Parent message */}
              {parentMessage && (
                <div className="border-b pb-4">
                  <ThreadMessageItem
                    message={parentMessage}
                    onReact={(emoji) => toggleReaction(parentMessage.id, emoji)}
                    isParent
                  />
                </div>
              )}

              {/* Replies count */}
              {replies.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex-1 h-px bg-border" />
                  <span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}

              {/* Replies */}
              <div className="space-y-2">
                {replies.map((reply) => (
                  <ThreadMessageItem
                    key={reply.id}
                    message={reply}
                    onReact={(emoji) => toggleReaction(reply.id, emoji)}
                  />
                ))}
              </div>
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Reply input */}
          {activeChannel?.membership && (
            <div className="border-t p-3">
              <div className="flex items-end gap-2 rounded-lg border bg-background p-2">
                <div className="flex-1 min-w-0">
                  <Textarea
                    ref={textareaRef}
                    value={replyContent}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Reply..."
                    className="min-h-[36px] max-h-[120px] resize-none border-0 focus-visible:ring-0 p-1 text-sm"
                    rows={1}
                  />
                </div>
                <Button
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleSendReply}
                  disabled={!replyContent.trim() || isSending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
