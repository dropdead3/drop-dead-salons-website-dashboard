import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { MessageItem } from './MessageItem';
import { useChatMessages, type MessageWithSender } from '@/hooks/team-chat/useChatMessages';
import { usePinnedMessages } from '@/hooks/team-chat/usePinnedMessages';
import { useTeamChatContext } from '@/contexts/TeamChatContext';

export function MessageList() {
  const { activeChannel, openThread } = useTeamChatContext();
  const { messages, isLoading, toggleReaction, deleteMessage } = useChatMessages(activeChannel?.id || null);
  const { pinMessage, unpinMessage, isPinned, pinnedMessages } = usePinnedMessages(activeChannel?.id || null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.id !== lastMessageIdRef.current) {
        lastMessageIdRef.current = lastMessage.id;
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  if (!activeChannel) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a channel to start chatting
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="text-4xl mb-4">💬</div>
        <h3 className="font-semibold text-lg">Welcome to #{activeChannel.name}</h3>
        <p className="text-muted-foreground text-sm mt-1">
          {activeChannel.description || 'This is the start of the conversation.'}
        </p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: MessageWithSender[] }[] = [];
  let currentDate = '';

  messages.forEach((msg) => {
    const msgDate = new Date(msg.created_at).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msgDate, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-6">
        {groupedMessages.map((group) => (
          <div key={group.date}>
            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">{group.date}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-1">
              {group.messages.map((message, index) => {
                const prevMessage = index > 0 ? group.messages[index - 1] : null;
                const isConsecutive =
                  prevMessage &&
                  prevMessage.sender_id === message.sender_id &&
                  new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() < 5 * 60 * 1000;

                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    isConsecutive={isConsecutive || false}
                    onReact={(emoji) => toggleReaction(message.id, emoji)}
                    onReply={() => openThread(message.id)}
                    onDelete={() => deleteMessage(message.id)}
                    onPin={() => {
                      const pinnedItem = pinnedMessages.find((pm) => pm.message.id === message.id);
                      if (pinnedItem) {
                        unpinMessage(pinnedItem.pinnedId);
                      } else {
                        pinMessage(message.id);
                      }
                    }}
                    isPinned={isPinned(message.id)}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}
