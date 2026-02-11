import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

export interface MessageWithSender extends ChatMessage {
  sender?: {
    id: string;
    full_name: string | null;
    display_name: string | null;
    photo_url: string | null;
  };
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  reply_count?: number;
}

export function useChatMessages(channelId: string | null, channelType?: string, channelMembers?: string[]) {
  const { user } = useAuth();
  const { data: userProfile } = useEmployeeProfile();
  const { effectiveOrganization } = useOrganizationContext();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['chat-messages', channelId],
    queryFn: async () => {
      if (!channelId) return [];

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
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .is('parent_message_id', null)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Get reactions and reply counts in parallel
      const messageIds = data?.map((m) => m.id) || [];
      const [{ data: reactions }, { data: replyCounts }] = await Promise.all([
        supabase
          .from('chat_message_reactions')
          .select('message_id, emoji, user_id')
          .in('message_id', messageIds),
        supabase
          .from('chat_messages')
          .select('parent_message_id')
          .in('parent_message_id', messageIds)
          .eq('is_deleted', false),
      ]);

      // Map reactions and replies to messages
      return data?.map((msg) => {
        const msgReactions = reactions?.filter((r) => r.message_id === msg.id) || [];
        const reactionMap = new Map<string, { count: number; users: string[] }>();
        msgReactions.forEach((r) => {
          const existing = reactionMap.get(r.emoji) || { count: 0, users: [] };
          existing.count++;
          existing.users.push(r.user_id);
          reactionMap.set(r.emoji, existing);
        });

        const replyCount = replyCounts?.filter((r) => r.parent_message_id === msg.id).length || 0;

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
          reply_count: replyCount,
        };
      }) as MessageWithSender[];
    },
    enabled: !!channelId,
    staleTime: 10_000,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!channelId) return;

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`chat-messages-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          // Invalidate and refetch on any change
          queryClient.invalidateQueries({ queryKey: ['chat-messages', channelId] });
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
          queryClient.invalidateQueries({ queryKey: ['chat-messages', channelId] });
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
  }, [channelId, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, parentMessageId }: { content: string; parentMessageId?: string }) => {
      if (!user?.id || !channelId) {
        throw new Error('Not authenticated or no channel selected');
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: channelId,
          sender_id: user.id,
          content,
          parent_message_id: parentMessageId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ content, parentMessageId }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['chat-messages', channelId] });

      // Snapshot previous messages for rollback
      const previousMessages = queryClient.getQueryData<MessageWithSender[]>(['chat-messages', channelId]);

      // Create optimistic message with user's profile info
      const optimisticMessage: MessageWithSender = {
        id: `temp-${Date.now()}`,
        channel_id: channelId!,
        sender_id: user!.id,
        content,
        content_html: null,
        parent_message_id: parentMessageId || null,
        is_edited: false,
        is_deleted: false,
        deleted_at: null,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: userProfile ? {
          id: userProfile.user_id,
          full_name: userProfile.full_name,
          display_name: userProfile.display_name,
          photo_url: userProfile.photo_url,
        } : undefined,
        reactions: [],
        reply_count: 0,
      };

      // Add optimistic message to cache immediately
      queryClient.setQueryData<MessageWithSender[]>(
        ['chat-messages', channelId],
        (old = []) => [...old, optimisticMessage]
      );

      return { previousMessages };
    },
    onError: (error, _variables, context) => {
      // Rollback to previous messages on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat-messages', channelId], context.previousMessages);
      }
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    },
    onSuccess: async (data, variables) => {
      // Trigger AI action detection for DM channels
      if (channelType === 'dm' && channelMembers && effectiveOrganization?.id && data) {
        const targetUserId = channelMembers.find(id => id !== user?.id);
        if (targetUserId) {
          try {
            await supabase.functions.invoke('detect-chat-action', {
              body: {
                messageId: data.id,
                messageContent: variables.content,
                senderId: user?.id,
                channelId: channelId,
                organizationId: effectiveOrganization.id,
                targetUserId,
              },
            });
          } catch (error) {
            // Silent fail - don't disrupt messaging
            console.error('Smart action detection failed:', error);
          }
        }
      }
    },
    onSettled: () => {
      // Refetch to sync with server (replaces temp ID with real ID)
      queryClient.invalidateQueries({ queryKey: ['chat-messages', channelId] });
      
      // Update last_read_at for the user in this channel
      if (user?.id && channelId) {
        supabase
          .from('chat_channel_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('channel_id', channelId)
          .eq('user_id', user.id)
          .then(() => {});
      }
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ['chat-messages', channelId] });
      toast.success('Message updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to edit message');
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
    },
    onError: () => {
      toast.error('Failed to delete message');
    },
  });

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

      if (error && error.code !== '23505') throw error; // Ignore duplicate key error
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

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user?.id) return;

      const message = messages?.find((m) => m.id === messageId);
      const reaction = message?.reactions?.find((r) => r.emoji === emoji);
      const hasReacted = reaction?.users.includes(user.id);

      if (hasReacted) {
        removeReactionMutation.mutate({ messageId, emoji });
      } else {
        addReactionMutation.mutate({ messageId, emoji });
      }
    },
    [messages, user?.id, addReactionMutation, removeReactionMutation]
  );

  return {
    messages: messages ?? [],
    isLoading,
    error,
    sendMessage: (content: string, parentMessageId?: string) =>
      sendMessageMutation.mutate({ content, parentMessageId }),
    editMessage: editMessageMutation.mutate,
    deleteMessage: deleteMessageMutation.mutate,
    toggleReaction,
    isSending: sendMessageMutation.isPending,
  };
}
