import { useState } from 'react';
import { X, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { usePinnedMessages } from '@/hooks/team-chat/usePinnedMessages';
import { useTeamChatContext } from '@/contexts/TeamChatContext';
import { Loader2 } from 'lucide-react';

interface PinnedMessagesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PinnedMessagesSheet({ open, onOpenChange }: PinnedMessagesSheetProps) {
  const { activeChannel } = useTeamChatContext();
  const { pinnedMessages, isLoading, unpinMessage } = usePinnedMessages(activeChannel?.id || null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Pin className="h-5 w-5" />
            Pinned Messages
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pinnedMessages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No pinned messages in this channel
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
            <div className="space-y-4">
              {pinnedMessages.map((pm) => {
                const senderName = pm.message.sender?.display_name || pm.message.sender?.full_name || 'Unknown';
                const initials = senderName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

                return (
                  <div key={pm.pinnedId} className="group relative border rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={pm.message.sender?.photo_url || undefined} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-medium text-sm">{senderName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(pm.message.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{pm.message.content}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => unpinMessage(pm.pinnedId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
