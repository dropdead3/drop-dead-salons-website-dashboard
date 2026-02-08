import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { MessageWithSender } from './useChatMessages';

export function useThreadMessages(parentMessageId: string | null) {
  const { user } = useAuth();
  const { data: userProfile } = useEmployeeProfile();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch the parent message
  const { data: parentMessage, isLoading: isLoadingParent } = useQuery({
    queryKey: ['thread-parent', parentMessageId],
    queryFn: async () => {
      if (!parentMessageId) return null;

      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:employee_profiles!chat_messages_sender_employee_fkey (
            user_id,
            full_name,
            display_name,
            photo_url
          )
        `)
        .eq('id', parentMessageId)
        .single();

      if (error) throw error;

      return {
        ...data,
        sender: data.sender ? {
          id: (data.sender as any).user_id,
          full_name: (data.sender as any).full_name,
          display_name: (data.sender as any).display_name,
          photo_url: (data.sender as any).photo_url,
        } : undefined,
      } as MessageWithSender;
    },
    enabled: !!parentMessageId,
  });

  // Fetch thread replies
  const { data: replies, isLoading: isLoadingReplies } = useQuery({
    queryKey: ['thread-replies', parentMessageId],
    queryFn: async () => {
      if (!parentMessageId) return [];

      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:employee_profiles!chat_messages_sender_employee_fkey (
            user_id,
            full_name,
            display_name,
            photo_url
          )
        `)
        .eq('parent_message_id', parentMessageId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get reactions for these messages
      const messageIds = data?.map((m) => m.id) || [];
      const { data: reactions } = await supabase
        .from('chat_message_reactions')
        .select('message_id, emoji, user_id')
        .in('message_id', messageIds);

      return data?.map((msg) => {
        const msgReactions = reactions?.filter((r) => r.message_id === msg.id) || [];
        const reactionMap = new Map<string, { count: number; users: string[] }>();
        msgReactions.forEach((r) => {
          const existing = reactionMap.get(r.emoji) || { count: 0, users: [] };
          existing.count++;
          existing.users.push(r.user_id);
          reactionMap.set(r.emoji, existing);
        });

        return {
          ...msg,
          sender: msg.sender ? {
            id: (msg.sender as any).user_id,
            full_name: (msg.sender as any).full_name,
            display_name: (msg.sender as any).display_name,
            photo_url: (msg.sender as any).photo_url,
          } : undefined,
          reactions: Array.from(reactionMap.entries()).map(([emoji, data]) => ({
            emoji,
            count: data.count,
            users: data.users,
          })),
        };
      }) as MessageWithSender[];
    },
    enabled: !!parentMessageId,
  });

  // Realtime subscription for thread replies
  useEffect(() => {
    if (!parentMessageId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`thread-${parentMessageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `parent_message_id=eq.${parentMessageId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['thread-replies', parentMessageId] });
          // Also invalidate the parent message's channel to update reply count
          if (parentMessage?.channel_id) {
            queryClient.invalidateQueries({ queryKey: ['chat-messages', parentMessage.channel_id] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_message_reactions',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['thread-replies', parentMessageId] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [parentMessageId, parentMessage?.channel_id, queryClient]);

  // Send reply mutation with optimistic updates for instant UI
  const sendReplyMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id || !parentMessageId || !parentMessage?.channel_id) {
        throw new Error('Cannot send reply');
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: parentMessage.channel_id,
          sender_id: user.id,
          content,
          parent_message_id: parentMessageId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    // Optimistic update: add reply instantly before server confirms
    onMutate: async (content: string) => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['thread-replies', parentMessageId] });

      // Snapshot current replies for potential rollback
      const previousReplies = queryClient.getQueryData<MessageWithSender[]>(
        ['thread-replies', parentMessageId]
      );

      // Create optimistic message with temp ID
      const optimisticReply: MessageWithSender = {
        id: `temp-${Date.now()}`,
        channel_id: parentMessage?.channel_id || '',
        sender_id: user!.id,
        content,
        parent_message_id: parentMessageId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_edited: false,
        is_deleted: false,
        deleted_at: null,
        content_html: null,
        metadata: null,
        sender: userProfile ? {
          id: userProfile.user_id,
          full_name: userProfile.full_name,
          display_name: userProfile.display_name,
          photo_url: userProfile.photo_url,
        } : undefined,
        reactions: [],
      };

      // Add optimistic reply to cache immediately
      queryClient.setQueryData<MessageWithSender[]>(
        ['thread-replies', parentMessageId],
        (old = []) => [...old, optimisticReply]
      );

      // Return context for rollback
      return { previousReplies };
    },
    onError: (error, _content, context) => {
      console.error('Failed to send reply:', error);
      // Rollback on error
      if (context?.previousReplies) {
        queryClient.setQueryData(
          ['thread-replies', parentMessageId],
          context.previousReplies
        );
      }
      toast.error('Failed to send reply');
    },
    onSettled: () => {
      // Sync with server to replace temp ID with real ID
      queryClient.invalidateQueries({ queryKey: ['thread-replies', parentMessageId] });
      if (parentMessage?.channel_id) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', parentMessage.channel_id] });
      }
    },
  });

  // Edit message mutation with 5-minute window validation
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      // First verify the message is within the 5-minute edit window
      const { data: message, error: fetchError } = await supabase
        .from('chat_messages')
        .select('created_at, sender_id')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;
      if (!message) throw new Error('Message not found');

      // Verify ownership
      if (message.sender_id !== user?.id) {
        throw new Error('You can only edit your own messages');
      }

      // Check 5-minute window
      const messageTime = new Date(message.created_at).getTime();
      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() - messageTime > fiveMinutes) {
        throw new Error('Edit window has expired (5 minutes)');
      }

      const { error } = await supabase
        .from('chat_messages')
        .update({ content, is_edited: true })
        .eq('id', messageId)
        .eq('sender_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread-replies', parentMessageId] });
      queryClient.invalidateQueries({ queryKey: ['thread-parent', parentMessageId] });
      toast.success('Message updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to edit message');
    },
  });

  // Delete message mutation (soft delete)
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread-replies', parentMessageId] });
      if (parentMessage?.channel_id) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', parentMessage.channel_id] });
      }
      toast.success('Message deleted');
    },
    onError: () => {
      toast.error('Failed to delete message');
    },
  });

  // Toggle reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('chat_message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji,
        });

      if (error && error.code !== '23505') throw error;
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('chat_message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      if (error) throw error;
    },
  });

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user?.id) return;

    const allMessages = [parentMessage, ...(replies || [])].filter(Boolean) as MessageWithSender[];
    const message = allMessages.find((m) => m.id === messageId);
    const reaction = message?.reactions?.find((r) => r.emoji === emoji);
    const hasReacted = reaction?.users.includes(user.id);

    if (hasReacted) {
      removeReactionMutation.mutate({ messageId, emoji });
    } else {
      addReactionMutation.mutate({ messageId, emoji });
    }
  };

  return {
    parentMessage,
    replies: replies ?? [],
    isLoading: isLoadingParent || isLoadingReplies,
    sendReply: (content: string) => sendReplyMutation.mutate(content),
    editMessage: editMessageMutation.mutate,
    deleteMessage: deleteMessageMutation.mutate,
    toggleReaction,
    isSending: sendReplyMutation.isPending,
  };
}
