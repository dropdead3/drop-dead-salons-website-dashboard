import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Check, ExternalLink, Megaphone } from 'lucide-react';
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

interface NotificationsPanelProps {
  unreadCount: number;
}

export function NotificationsPanel({ unreadCount }: NotificationsPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to realtime announcements changes
  useEffect(() => {
    const channel = supabase
      .channel('announcements-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        () => {
          // Invalidate queries to refetch data when announcements change
          queryClient.invalidateQueries({ queryKey: ['notifications-announcements'] });
          queryClient.invalidateQueries({ queryKey: ['unread-announcements-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch recent announcements
  const { data: announcements, isLoading } = useQuery({
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

  // Mark announcement as read
  const markAsReadMutation = useMutation({
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

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadAnnouncements = announcements?.filter(a => !a.isRead) || [];
      
      if (unreadAnnouncements.length === 0) return;

      const { error } = await supabase
        .from('announcement_reads')
        .upsert(
          unreadAnnouncements.map(a => ({
            announcement_id: a.id,
            user_id: user?.id || '',
          })),
          { onConflict: 'announcement_id,user_id' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-announcements'] });
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
          <h4 className="font-semibold text-sm">Notifications</h4>
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
          ) : announcements && announcements.length > 0 ? (
            <div className="divide-y divide-border">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={cn(
                    "p-3 transition-colors hover:bg-muted/50 cursor-pointer",
                    !announcement.isRead && "bg-primary/5"
                  )}
                  onClick={() => {
                    if (!announcement.isRead) {
                      markAsReadMutation.mutate(announcement.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      "p-1.5 rounded-md border shrink-0 mt-0.5",
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
                          <span className="text-[10px] bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded shrink-0">
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