import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X, Pin, ExternalLink, Settings, Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserLocationAccess } from '@/hooks/useUserLocationAccess';
import { useUnreadAnnouncementCount } from '@/hooks/useUnreadAnnouncementCount';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { LocationSelect } from '@/components/ui/location-select';

type Priority = 'low' | 'normal' | 'high' | 'urgent';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: Priority;
  is_pinned: boolean;
  created_at: string;
  link_url: string | null;
  link_label: string | null;
  location_id: string | null;
}

const priorityColors: Record<Priority, string> = {
  low: 'border-l-muted-foreground',
  normal: 'border-l-blue-500',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500',
};

const normalizeUrl = (url: string): string => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

interface AnnouncementsDrawerProps {
  isLeadership: boolean;
}

export function AnnouncementsDrawer({ isLeadership }: AnnouncementsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState('all');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { assignedLocationIds, canViewAllLocations } = useUserLocationAccess();
  const { data: unreadCount = 0 } = useUnreadAnnouncementCount();

  const { data: announcements } = useQuery({
    queryKey: ['announcements-drawer', assignedLocationIds, canViewAllLocations],
    queryFn: async () => {
      let query = supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (!canViewAllLocations && assignedLocationIds.length > 0) {
        query = query.or(`location_id.is.null,location_id.in.(${assignedLocationIds.join(',')})`);
      }

      const { data, error } = await query
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Announcement[];
    },
  });

  const filteredAnnouncements = useMemo(() => {
    if (!announcements) return [];
    if (locationFilter === 'all') return announcements;
    return announcements.filter(
      a => a.location_id === null || a.location_id === locationFilter
    );
  }, [announcements, locationFilter]);

  // Mark as read when drawer opens
  useEffect(() => {
    if (!isOpen || !user?.id || !announcements || announcements.length === 0) return;

    const markAsRead = async () => {
      const { data: existingReads } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', user.id);

      const readIds = new Set(existingReads?.map(r => r.announcement_id) || []);
      const unread = announcements.filter(a => !readIds.has(a.id));
      if (unread.length === 0) return;

      const { error } = await supabase
        .from('announcement_reads')
        .insert(unread.map(a => ({ announcement_id: a.id, user_id: user.id })));

      if (!error) {
        queryClient.invalidateQueries({ queryKey: ['unread-announcement-count'] });
        queryClient.invalidateQueries({ queryKey: ['unread-announcements-count'] });
      }
    };

    markAsRead();
  }, [isOpen, announcements, user?.id, queryClient]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Trigger FAB */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed right-6 lg:right-8 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full shadow-lg bg-card border border-border/40 flex items-center justify-center hover:shadow-xl hover:scale-105 transition-all duration-200 group"
        aria-label="Toggle announcements"
      >
        <Megaphone className="w-5 h-5 text-foreground/70 group-hover:text-foreground transition-colors" />
        
        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center shadow-sm"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[380px] max-w-[90vw] bg-card/95 backdrop-blur-xl shadow-2xl border-l border-border/30 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-border/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-oat" />
                    <h2 className="font-display text-xs tracking-[0.15em]">ANNOUNCEMENTS</h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Location filter + Leadership actions */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <LocationSelect
                      value={locationFilter}
                      onValueChange={setLocationFilter}
                      includeAll
                      allLabel="All Locations"
                      triggerClassName="h-8 text-xs bg-muted/30 border-border/40"
                    />
                  </div>
                  {isLeadership && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link to="/dashboard/announcements">
                          <Settings className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link to="/dashboard/announcements/create">
                          <Plus className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Announcement list */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {filteredAnnouncements.length > 0 ? (
                    filteredAnnouncements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className={`group relative p-4 rounded-xl bg-muted/30 border border-border/30 border-l-[3px] ${priorityColors[announcement.priority || 'normal']} hover:bg-muted/50 hover:translate-x-0.5 transition-all duration-200`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              {announcement.is_pinned && (
                                <Pin className="w-3 h-3 text-oat shrink-0" />
                              )}
                              <h3 className="text-sm font-medium truncate">{announcement.title}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {announcement.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] text-muted-foreground/60 tracking-wide">
                                {formatDate(announcement.created_at)}
                              </span>
                              {announcement.link_url && (
                                <a
                                  href={normalizeUrl(announcement.link_url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                                >
                                  {announcement.link_label || 'Learn more'}
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-14 text-muted-foreground">
                      <Megaphone className="w-7 h-7 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-display">No announcements</p>
                      <p className="text-xs mt-1 text-muted-foreground/60">You're all caught up</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="p-4 border-t border-border/30">
                <Button variant="ghost" className="w-full justify-center text-xs h-9 text-muted-foreground hover:text-foreground" asChild>
                  <Link to="/dashboard/announcements">
                    View All Announcements
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
