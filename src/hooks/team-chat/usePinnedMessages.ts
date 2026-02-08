import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { MessageWithSender } from './useChatMessages';

export function usePinnedMessages(channelId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pinnedMessages, isLoading } = useQuery({
    queryKey: ['pinned-messages', channelId],
    queryFn: async () => {
      if (!channelId) return [];

      const { data, error } = await supabase
        .from('chat_pinned_messages')
        .select(`
          id,
          pinned_at,
          pinned_by,
          message:chat_messages (
            *,
            sender:employee_profiles!chat_messages_sender_id_fkey (
              user_id,
              full_name,
              display_name,
              photo_url
            )
          )
        `)
        .eq('channel_id', channelId)
        .order('pinned_at', { ascending: false });

      if (error) throw error;

      return data?.map((pm) => ({
        pinnedId: pm.id,
        pinnedAt: pm.pinned_at,
        pinnedBy: pm.pinned_by,
        message: {
          ...(pm.message as any),
          sender: (pm.message as any)?.sender ? {
            id: (pm.message as any).sender.user_id,
            full_name: (pm.message as any).sender.full_name,
            display_name: (pm.message as any).sender.display_name,
            photo_url: (pm.message as any).sender.photo_url,
          } : undefined,
        } as MessageWithSender,
      })) ?? [];
    },
    enabled: !!channelId,
  });

  const pinMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user?.id || !channelId) throw new Error('Cannot pin message');

      const { error } = await supabase
        .from('chat_pinned_messages')
        .insert({
          channel_id: channelId,
          message_id: messageId,
          pinned_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinned-messages', channelId] });
      toast.success('Message pinned');
    },
    onError: () => {
      toast.error('Failed to pin message');
    },
  });

  const unpinMessageMutation = useMutation({
    mutationFn: async (pinnedId: string) => {
      const { error } = await supabase
        .from('chat_pinned_messages')
        .delete()
        .eq('id', pinnedId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinned-messages', channelId] });
      toast.success('Message unpinned');
    },
    onError: () => {
      toast.error('Failed to unpin message');
    },
  });

  const isPinned = (messageId: string) => 
    pinnedMessages?.some((pm) => pm.message.id === messageId) ?? false;

  return {
    pinnedMessages: pinnedMessages ?? [],
    isLoading,
    pinMessage: pinMessageMutation.mutate,
    unpinMessage: unpinMessageMutation.mutate,
    isPinned,
    pinnedCount: pinnedMessages?.length ?? 0,
  };
}
