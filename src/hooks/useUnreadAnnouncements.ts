import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadAnnouncements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-announcements-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Get all active announcements
      const { data: announcements, error: announcementsError } = await supabase
        .from('announcements')
        .select('id')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (announcementsError) throw announcementsError;

      if (!announcements || announcements.length === 0) return 0;

      // Get read announcements for this user
      const { data: reads, error: readsError } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', user.id);

      if (readsError) throw readsError;

      const readIds = new Set(reads?.map(r => r.announcement_id) || []);
      const unreadCount = announcements.filter(a => !readIds.has(a.id)).length;

      return unreadCount;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
