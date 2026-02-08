import { useState, useMemo } from 'react';
import { Settings, Trash2, Archive, Hash, MapPin, Lock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTeamChatContext } from '@/contexts/TeamChatContext';
import { useChannelMembers } from '@/hooks/team-chat/useChannelMembers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ChannelSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChannelSettingsSheet({ open, onOpenChange }: ChannelSettingsSheetProps) {
  const { activeChannel, setActiveChannel } = useTeamChatContext();
  const { isOwner, isAdmin, members } = useChannelMembers(activeChannel?.id || null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // For DM channels, find the other person's name
  const dmPartnerName = useMemo(() => {
    if (activeChannel?.type !== 'dm') return null;
    const partner = members.find(m => m.userId !== user?.id);
    return partner?.profile?.displayName || partner?.profile?.fullName || 'Team Member';
  }, [activeChannel?.type, members, user?.id]);

  const displayName = activeChannel?.type === 'dm'
    ? `DM with ${dmPartnerName}` 
    : activeChannel?.name || '';

  const [name, setName] = useState(activeChannel?.name || '');
  const [description, setDescription] = useState(activeChannel?.description || '');

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!activeChannel?.id) throw new Error('No channel');

      const { error } = await supabase
        .from('chat_channels')
        .update({ name, description })
        .eq('id', activeChannel.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
      toast.success('Channel updated');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to update channel');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      if (!activeChannel?.id) throw new Error('No channel');

      const { error } = await supabase
        .from('chat_channels')
        .update({ is_archived: true })
        .eq('id', activeChannel.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
      setActiveChannel(null);
      toast.success('Channel archived');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to archive channel');
    },
  });

  if (!activeChannel) return null;

  const isDM = activeChannel.type === 'dm';
  const ChannelIcon = isDM ? MessageCircle :
                      activeChannel.type === 'location' ? MapPin : 
                      activeChannel.type === 'private' ? Lock : Hash;
  const canEdit = isAdmin && !activeChannel.is_system && !isDM;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {isDM ? 'Conversation Settings' : 'Channel Settings'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <ChannelIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold">{displayName}</div>
              <div className="text-sm text-muted-foreground capitalize">
                {isDM ? 'Direct Message' : `${activeChannel.type} channel`}
              </div>
            </div>
          </div>

          {!isDM && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Channel name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!canEdit}
                  rows={3}
                />
              </div>
            </div>
          )}

          {activeChannel.is_system && !isDM && (
            <p className="text-sm text-muted-foreground">
              This is a system channel and cannot be modified.
            </p>
          )}
        </div>

        <SheetFooter className="flex-col gap-2">
          {canEdit && (
            <>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="w-full"
              >
                Save Changes
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full text-destructive">
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Channel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Archive this channel?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will hide the channel from the sidebar. Members will no longer be able to send messages.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => archiveMutation.mutate()}>
                      Archive
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
