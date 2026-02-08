import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import type { MessageWithSender } from './useChatMessages';

export interface SearchResult extends MessageWithSender {
  channelName: string;
  channelType: string;
}

export function useMessageSearch(query: string, enabled: boolean = true) {
  const { user } = useAuth();
  const { effectiveOrganization } = useOrganizationContext();

  const { data: results, isLoading } = useQuery({
    queryKey: ['message-search', query, effectiveOrganization?.id],
    queryFn: async () => {
      if (!user?.id || !query.trim() || query.length < 2) return [];

      // Get channels user is a member of
      const { data: memberChannels } = await supabase
        .from('chat_channel_members')
        .select('channel_id')
        .eq('user_id', user.id);

      if (!memberChannels || memberChannels.length === 0) return [];

      const channelIds = memberChannels.map((c) => c.channel_id);

      // Search messages in those channels
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:employee_profiles!chat_messages_sender_id_fkey (
            user_id,
            full_name,
            display_name,
            photo_url
          ),
          channel:chat_channels!inner (
            name,
            type
          )
        `)
        .in('channel_id', channelIds)
        .eq('is_deleted', false)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data?.map((msg) => ({
        ...msg,
        sender: msg.sender ? {
          id: (msg.sender as any).user_id,
          full_name: (msg.sender as any).full_name,
          display_name: (msg.sender as any).display_name,
          photo_url: (msg.sender as any).photo_url,
        } : undefined,
        channelName: (msg.channel as any)?.name ?? 'Unknown',
        channelType: (msg.channel as any)?.type ?? 'public',
      })) as SearchResult[];
    },
    enabled: enabled && !!user?.id && query.length >= 2,
  });

  return {
    results: results ?? [],
    isLoading,
  };
}
