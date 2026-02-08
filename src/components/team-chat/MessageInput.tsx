import { useState, useRef, useCallback, KeyboardEvent, useMemo, useEffect } from 'react';
import { Send, Paperclip, Smile, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useChatMessages } from '@/hooks/team-chat/useChatMessages';
import { useChannelMembers } from '@/hooks/team-chat/useChannelMembers';
import { useTeamChatContext } from '@/contexts/TeamChatContext';
import { MentionAutocomplete } from './MentionAutocomplete';

export function MessageInput() {
  const { activeChannel } = useTeamChatContext();
  const { members } = useChannelMembers(activeChannel?.id || null);
  
  // Get member IDs for DM detection
  const memberIds = useMemo(() => members.map(m => m.userId), [members]);
  
  const { sendMessage, isSending } = useChatMessages(
    activeChannel?.id || null,
    activeChannel?.type,
    memberIds
  );
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  const handleSend = useCallback(() => {
    if (!content.trim() || isSending || !activeChannel?.membership) return;

    sendMessage(content.trim());
    setContent('');
    setShowMentions(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [content, isSending, sendMessage, activeChannel?.membership]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't send if mention autocomplete is open (let it handle Enter/Tab)
    if (showMentions) return;
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const checkForMention = (text: string, cursorPos: number) => {
    // Look backwards from cursor to find @ symbol
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex === -1) {
      setShowMentions(false);
      return;
    }
    
    // Check if there's a space between @ and cursor (means mention is complete)
    const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
    
    // Only show if @ is at start or preceded by whitespace, and no spaces in query
    const charBeforeAt = lastAtIndex > 0 ? text[lastAtIndex - 1] : ' ';
    const isValidStart = charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0;
    const hasNoSpaces = !textAfterAt.includes(' ') && !textAfterAt.includes('\n');
    
    if (isValidStart && hasNoSpaces && textAfterAt.length < 30) {
      setMentionQuery(textAfterAt);
      setMentionStartIndex(lastAtIndex);
      setShowMentions(true);
      
      // Calculate position for dropdown
      if (containerRef.current) {
        setMentionPosition({ top: -8, left: 0 }); // Position above input
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Check for mention trigger
    const cursorPos = e.target.selectionStart || 0;
    checkForMention(newContent, cursorPos);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  const handleMentionSelect = useCallback((userId: string, displayName: string) => {
    if (mentionStartIndex === -1) return;
    
    // Replace @query with @[displayName](userId)
    const beforeMention = content.slice(0, mentionStartIndex);
    const afterMention = content.slice(mentionStartIndex + mentionQuery.length + 1); // +1 for @
    const mentionText = `@[${displayName}](${userId}) `;
    
    const newContent = beforeMention + mentionText + afterMention;
    setContent(newContent);
    setShowMentions(false);
    setMentionQuery('');
    setMentionStartIndex(-1);
    
    // Focus back to textarea
    textareaRef.current?.focus();
  }, [content, mentionStartIndex, mentionQuery]);

  const handleMentionClose = useCallback(() => {
    setShowMentions(false);
    setMentionQuery('');
    setMentionStartIndex(-1);
  }, []);

  const triggerMention = useCallback(() => {
    if (!textareaRef.current) return;
    
    const cursorPos = textareaRef.current.selectionStart || content.length;
    const beforeCursor = content.slice(0, cursorPos);
    const afterCursor = content.slice(cursorPos);
    
    // Add @ if not already there
    const needsSpace = beforeCursor.length > 0 && !beforeCursor.endsWith(' ') && !beforeCursor.endsWith('\n');
    const newContent = beforeCursor + (needsSpace ? ' @' : '@') + afterCursor;
    
    setContent(newContent);
    
    // Trigger mention check
    setTimeout(() => {
      const newCursorPos = cursorPos + (needsSpace ? 2 : 1);
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      checkForMention(newContent, newCursorPos);
      textareaRef.current?.focus();
    }, 0);
  }, [content]);

  if (!activeChannel) return null;

  const canSend = !!activeChannel.membership;

  return (
    <div className="border-t p-4">
      <div
        ref={containerRef}
        className={cn(
          'relative flex items-end gap-2 rounded-lg border bg-background p-2',
          !canSend && 'opacity-60'
        )}
      >
        {/* Mention Autocomplete */}
        {showMentions && (
          <MentionAutocomplete
            query={mentionQuery}
            position={mentionPosition}
            onSelect={handleMentionSelect}
            onClose={handleMentionClose}
          />
        )}

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
          <Button variant="ghost" size="icon" disabled={!canSend} onClick={triggerMention}>
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
