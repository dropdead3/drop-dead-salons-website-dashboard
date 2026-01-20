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

      // Get read announcements for this user
      const { data: reads, error: readsError } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', user.id);

      if (readsError) throw readsError;

      const readIds = new Set(reads?.map(r => r.announcement_id) || []);
      const unreadAnnouncementCount = (announcements || []).filter(a => !readIds.has(a.id)).length;

      // Get unread user notifications
      const { count: unreadNotificationCount, error: notifError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (notifError) throw notifError;

      return unreadAnnouncementCount + (unreadNotificationCount || 0);
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
}
