import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { MessageWithSender } from './useChatMessages';

interface ThreadPreview {
  id: string;
  content: string;
  sender?: {
    id: string;
    full_name: string | null;
    display_name: string | null;
    photo_url: string | null;
  };
}

interface PinnedMessageWithThread {
  pinnedId: string;
  pinnedAt: string;
  pinnedBy: string | null;
  message: MessageWithSender;
  replyCount: number;
  threadPreviews: ThreadPreview[];
}

export function usePinnedMessages(channelId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pinnedMessages, isLoading } = useQuery({
    queryKey: ['pinned-messages', channelId],
    queryFn: async (): Promise<PinnedMessageWithThread[]> => {
      if (!channelId) return [];

      const { data, error } = await supabase
        .from('chat_pinned_messages')
        .select(`
          id,
          pinned_at,
          pinned_by,
          message:chat_messages (
            *,
            sender:employee_profiles!chat_messages_sender_employee_fkey (
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

      if (!data || data.length === 0) return [];

      // Get message IDs for thread counts and previews
      const messageIds = data.map((pm) => (pm.message as any)?.id).filter(Boolean);

      // Fetch reply counts for pinned messages
      const { data: repliesData } = await supabase
        .from('chat_messages')
        .select(`
          id,
          parent_message_id,
          content,
          created_at,
          sender:employee_profiles!chat_messages_sender_employee_fkey (
            user_id,
            full_name,
            display_name,
            photo_url
          )
        `)
        .in('parent_message_id', messageIds)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      // Group replies by parent message
      const repliesByParent = new Map<string, typeof repliesData>();
      repliesData?.forEach((reply) => {
        const parentId = reply.parent_message_id!;
        if (!repliesByParent.has(parentId)) {
          repliesByParent.set(parentId, []);
        }
        repliesByParent.get(parentId)!.push(reply);
      });

      return data.map((pm) => {
        const messageData = pm.message as any;
        const messageId = messageData?.id;
        const replies = repliesByParent.get(messageId) || [];

        // Get first 2 replies for preview
        const threadPreviews: ThreadPreview[] = replies.slice(0, 2).map((reply: any) => ({
          id: reply.id,
          content: reply.content,
          sender: reply.sender ? {
            id: reply.sender.user_id,
            full_name: reply.sender.full_name,
            display_name: reply.sender.display_name,
            photo_url: reply.sender.photo_url,
          } : undefined,
        }));

        return {
          pinnedId: pm.id,
          pinnedAt: pm.pinned_at!,
          pinnedBy: pm.pinned_by,
          message: {
            ...messageData,
            sender: messageData?.sender ? {
              id: messageData.sender.user_id,
              full_name: messageData.sender.full_name,
              display_name: messageData.sender.display_name,
              photo_url: messageData.sender.photo_url,
            } : undefined,
          } as MessageWithSender,
          replyCount: replies.length,
          threadPreviews,
        };
      });
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

  const getPinnedItem = (messageId: string) =>
    pinnedMessages?.find((pm) => pm.message.id === messageId);

  return {
    pinnedMessages: pinnedMessages ?? [],
    isLoading,
    pinMessage: pinMessageMutation.mutate,
    unpinMessage: unpinMessageMutation.mutate,
    isPinned,
    getPinnedItem,
    pinnedCount: pinnedMessages?.length ?? 0,
  };
}
