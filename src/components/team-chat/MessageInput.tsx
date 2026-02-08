import { useRef, useCallback, useMemo, useState } from 'react';
import { Send, Paperclip, Smile, AtSign, X, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useChatMessages } from '@/hooks/team-chat/useChatMessages';
import { useChannelMembers } from '@/hooks/team-chat/useChannelMembers';
import { getChannelDisplayName } from '@/hooks/team-chat/useChannelDisplayName';
import { useTeamChatContext } from '@/contexts/TeamChatContext';
import { MentionInput, MentionInputRef } from './MentionInput';
import { EmojiPickerPopover } from './EmojiPickerPopover';
import { useChatAttachments } from '@/hooks/team-chat/useChatAttachments';

export function MessageInput() {
  const { activeChannel } = useTeamChatContext();
  const { members } = useChannelMembers(activeChannel?.id || null);
  const mentionInputRef = useRef<MentionInputRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get member IDs for DM detection
  const memberIds = useMemo(() => members.map(m => m.userId), [members]);
  
  const { sendMessage, isSending } = useChatMessages(
    activeChannel?.id || null,
    activeChannel?.type,
    memberIds
  );

  // File attachments
  const { pendingFiles, isUploading, addFiles, removeFile, clearFiles, uploadFiles } = useChatAttachments(activeChannel?.id || null);

  const handleSend = useCallback(async (content: string) => {
    if ((!content.trim() && pendingFiles.length === 0) || isSending || !activeChannel?.membership) return;
    
    // Upload attachments first if any
    if (pendingFiles.length > 0) {
      const uploaded = await uploadFiles();
      // For now, just send the message - attachment metadata can be added to message later
    }
    
    if (content.trim()) {
      sendMessage(content.trim());
    }
  }, [isSending, sendMessage, activeChannel?.membership, pendingFiles, uploadFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = ''; // Reset input
    }
  }, [addFiles]);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInsertEmoji = useCallback((emoji: string) => {
    mentionInputRef.current?.insertEmoji(emoji);
  }, []);

  const triggerMention = useCallback(() => {
    mentionInputRef.current?.triggerMention();
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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Pending attachments preview */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {pendingFiles.map((file, index) => (
            <div
              key={`${file.file.name}-${index}`}
              className={cn(
                'relative flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50',
                file.error && 'border-destructive'
              )}
            >
              {file.preview ? (
                <img src={file.preview} alt={file.file.name} className="h-8 w-8 object-cover rounded" />
              ) : (
                <FileIcon className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-sm max-w-[150px] truncate">{file.file.name}</span>
              {file.uploading && (
                <div className="w-12 h-1 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${file.progress}%` }} />
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0"
                onClick={() => removeFile(index)}
                disabled={file.uploading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div
        className={cn(
          'relative flex items-end gap-2 rounded-lg border bg-background p-2',
          !canSend && 'opacity-60'
        )}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="shrink-0" 
          disabled={!canSend}
          onClick={triggerFileSelect}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <MentionInput
          ref={mentionInputRef}
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
          <EmojiPickerPopover onEmojiSelect={handleInsertEmoji}>
            <Button variant="ghost" size="icon" disabled={!canSend}>
              <Smile className="h-5 w-5" />
            </Button>
          </EmojiPickerPopover>
          <Button
            size="icon"
            onClick={() => {
              const editor = document.querySelector('[role="textbox"][contenteditable="true"]') as HTMLElement;
              if (editor) {
                const content = editor.textContent?.trim();
                if (content || pendingFiles.length > 0) {
                  // Trigger the input's send mechanism
                  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
                  editor.dispatchEvent(event);
                }
              }
            }}
            disabled={isSending || isUploading || !canSend}
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
