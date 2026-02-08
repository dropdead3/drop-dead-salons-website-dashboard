import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useChannelMessageCount(channelId: string | null) {
  return useQuery({
    queryKey: ['channel-message-count', channelId],
    queryFn: async () => {
      if (!channelId) return 0;
      
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channelId)
        .eq('is_deleted', false);
      
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!channelId,
  });
}
