import { useRef, useCallback, useMemo } from 'react';
import { Send, Paperclip, Smile, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useChatMessages } from '@/hooks/team-chat/useChatMessages';
import { useChannelMembers } from '@/hooks/team-chat/useChannelMembers';
import { getChannelDisplayName } from '@/hooks/team-chat/useChannelDisplayName';
import { useTeamChatContext } from '@/contexts/TeamChatContext';
import { MentionInput } from './MentionInput';

export function MessageInput() {
  const { activeChannel } = useTeamChatContext();
  const { members } = useChannelMembers(activeChannel?.id || null);
  const mentionInputRef = useRef<{ triggerMention: () => void }>(null);
  
  // Get member IDs for DM detection
  const memberIds = useMemo(() => members.map(m => m.userId), [members]);
  
  const { sendMessage, isSending } = useChatMessages(
    activeChannel?.id || null,
    activeChannel?.type,
    memberIds
  );

  const handleSend = useCallback((content: string) => {
    if (!content.trim() || isSending || !activeChannel?.membership) return;
    sendMessage(content.trim());
  }, [isSending, sendMessage, activeChannel?.membership]);

  const triggerMention = useCallback(() => {
    // Access the editor through DOM and trigger @
    const editor = document.querySelector('[role="textbox"][contenteditable="true"]') as HTMLElement;
    if (!editor) return;
    
    editor.focus();
    
    const selection = window.getSelection();
    if (!selection) return;
    
    // Get or create selection at end
    let range: Range;
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    
    // Check if we need a space before @
    const textBefore = range.startContainer.textContent?.slice(0, range.startOffset) || '';
    const needsSpace = textBefore.length > 0 && !textBefore.endsWith(' ') && !textBefore.endsWith('\n');
    
    // Insert @ (with space if needed)
    const textToInsert = needsSpace ? ' @' : '@';
    const textNode = document.createTextNode(textToInsert);
    range.insertNode(textNode);
    
    // Move cursor after @
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Trigger input event to activate mention detection
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }, []);

  if (!activeChannel) return null;

  const canSend = !!activeChannel.membership;
  const isDM = activeChannel.type === 'dm' || activeChannel.type === 'group_dm';
  
  // Get display name - for DMs, try to get partner name from members if dm_partner isn't available
  let displayName = getChannelDisplayName(activeChannel);
  if (isDM && displayName === 'Team Member' && members.length > 0) {
    const partner = members.find(m => m.profile?.displayName || m.profile?.fullName);
    if (partner) {
      displayName = partner.profile.displayName || partner.profile.fullName || displayName;
    }
  }

  return (
    <div className="border-t p-4">
      <div
        className={cn(
          'relative flex items-end gap-2 rounded-lg border bg-background p-2',
          !canSend && 'opacity-60'
        )}
      >
        <Button variant="ghost" size="icon" className="shrink-0" disabled={!canSend}>
          <Paperclip className="h-5 w-5" />
        </Button>

        <MentionInput
          placeholder={
            canSend
              ? (isDM ? `Message ${displayName}` : `Message #${displayName}`)
              : `Join #${displayName} to send messages`
          }
          disabled={!canSend}
          onSend={handleSend}
        />

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" disabled={!canSend} onClick={triggerMention}>
            <AtSign className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" disabled={!canSend}>
            <Smile className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            onClick={() => {
              const editor = document.querySelector('[role="textbox"][contenteditable="true"]') as HTMLElement;
              if (editor) {
                const content = editor.textContent?.trim();
                if (content) {
                  // Trigger the input's send mechanism
                  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
                  editor.dispatchEvent(event);
                }
              }
            }}
            disabled={isSending || !canSend}
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
