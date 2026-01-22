import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Check, ExternalLink, Megaphone, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string | null;
  is_pinned: boolean | null;
  created_at: string;
}

interface UserNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsPanelProps {
  unreadCount: number;
}

export function NotificationsPanel({ unreadCount }: NotificationsPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Subscribe to realtime announcements and notifications changes
  useEffect(() => {
    const announcementsChannel = supabase
      .channel('announcements-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications-announcements'] });
          queryClient.invalidateQueries({ queryKey: ['unread-announcements-count'] });
        }
      )
      .subscribe();

    const notificationsChannel = supabase
      .channel('user-notifications-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unread-announcements-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(announcementsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [queryClient, user?.id]);

  // Fetch recent announcements
  const { data: announcements, isLoading: loadingAnnouncements } = useQuery({
    queryKey: ['notifications-announcements', user?.id],
    queryFn: async () => {
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (announcementsError) throw announcementsError;

      // Get read status for each announcement
      const { data: reads, error: readsError } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', user?.id || '');

      if (readsError) throw readsError;

      const readIds = new Set(reads?.map(r => r.announcement_id) || []);

      return (announcementsData || []).map((a: Announcement) => ({
        ...a,
        isRead: readIds.has(a.id),
      }));
    },
    enabled: !!user?.id,
  });

  // Fetch user notifications (high-fives, etc.)
  const { data: userNotifications, isLoading: loadingNotifications } = useQuery({
    queryKey: ['user-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id || '')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as UserNotification[];
    },
    enabled: !!user?.id,
  });

  const isLoading = loadingAnnouncements || loadingNotifications;

  // Mark announcement as read
  const markAnnouncementAsReadMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      const { error } = await supabase
        .from('announcement_reads')
        .upsert({
          announcement_id: announcementId,
          user_id: user?.id || '',
        }, {
          onConflict: 'announcement_id,user_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['unread-announcements-count'] });
    },
  });

  // Mark user notification as read
  const markNotificationAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-announcements-count'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadAnnouncements = announcements?.filter(a => !a.isRead) || [];
      const unreadNotifications = userNotifications?.filter(n => !n.is_read) || [];
      
      // Mark announcements as read
      if (unreadAnnouncements.length > 0) {
        await supabase
          .from('announcement_reads')
          .upsert(
            unreadAnnouncements.map(a => ({
              announcement_id: a.id,
              user_id: user?.id || '',
            })),
            { onConflict: 'announcement_id,user_id' }
          );
      }

      // Mark user notifications as read
      if (unreadNotifications.length > 0) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user?.id || '')
          .eq('is_read', false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-announcements-count'] });
    },
  });

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive/10 border-destructive/30 text-destructive';
      case 'important':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-600';
      default:
        return 'bg-muted border-border';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground px-1 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h4 className="font-medium text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-3 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (announcements && announcements.length > 0) || (userNotifications && userNotifications.length > 0) ? (
            <div className="divide-y divide-border">
              {/* User Notifications (high-fives, etc.) */}
              {userNotifications?.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 transition-colors hover:bg-muted/50 cursor-pointer",
                    !notification.is_read && "bg-primary/5"
                  )}
                  onClick={() => {
                    if (!notification.is_read) {
                      markNotificationAsReadMutation.mutate(notification.id);
                    }
                    if (notification.link) {
                      navigate(notification.link);
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded-full border shrink-0 mt-0.5 bg-amber-500/10 border-amber-500/30 text-amber-600">
                      <Hand className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm",
                        !notification.is_read && "font-semibold"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))}

              {/* Announcements */}
              {announcements?.map((announcement) => (
                <div
                  key={announcement.id}
                  className={cn(
                    "p-3 transition-colors hover:bg-muted/50 cursor-pointer",
                    !announcement.isRead && "bg-primary/5"
                  )}
                  onClick={() => {
                    if (!announcement.isRead) {
                      markAnnouncementAsReadMutation.mutate(announcement.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      "p-1.5 rounded-full border shrink-0 mt-0.5",
                      getPriorityColor(announcement.priority)
                    )}>
                      <Megaphone className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm truncate",
                          !announcement.isRead && "font-semibold"
                        )}>
                          {announcement.title}
                        </p>
                        {announcement.is_pinned && (
                          <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded shrink-0">
                            Pinned
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {announcement.content}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!announcement.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground/70">You're all caught up!</p>
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t border-border">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="w-full justify-center text-xs h-8">
              View all announcements
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}