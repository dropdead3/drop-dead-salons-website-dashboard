import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UnreadCount {
  channelId: string;
  count: number;
}

export function useUnreadMessages(channelIds: string[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: unreadCounts } = useQuery({
    queryKey: ['unread-counts', channelIds, user?.id],
    queryFn: async () => {
      if (!user?.id || channelIds.length === 0) return [];

      // Get last read timestamps for all channels
      const { data: memberships } = await supabase
        .from('chat_channel_members')
        .select('channel_id, last_read_at')
        .eq('user_id', user.id)
        .in('channel_id', channelIds);

      if (!memberships) return [];

      // Get message counts after last_read_at for each channel
      const counts: UnreadCount[] = [];

      for (const membership of memberships) {
        const lastRead = membership.last_read_at || '1970-01-01';
        
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('channel_id', membership.channel_id)
          .eq('is_deleted', false)
          .is('parent_message_id', null)
          .gt('created_at', lastRead)
          .neq('sender_id', user.id); // Don't count own messages

        counts.push({
          channelId: membership.channel_id,
          count: count || 0,
        });
      }

      return counts;
    },
    enabled: !!user?.id && channelIds.length > 0,
    staleTime: 15_000,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (channelId: string) => {
      if (!user?.id) return;

      const { error } = await supabase
        .from('chat_channel_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('channel_id', channelId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-counts'] });
    },
  });

  return {
    unreadCounts: unreadCounts ?? [],
    markAsRead: markAsReadMutation.mutate,
    getUnreadCount: (channelId: string) => 
      unreadCounts?.find((c) => c.channelId === channelId)?.count ?? 0,
  };
}
