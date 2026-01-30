import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceUser {
  user_id: string;
  full_name: string | null;
  photo_url: string | null;
  online_at: string;
}

interface UsePlatformPresenceReturn {
  onlineUsers: Map<string, PresenceUser>;
  onlineCount: number;
  isOnline: (userId: string) => boolean;
  isConnected: boolean;
}

export function usePlatformPresence(): UsePlatformPresenceReturn {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceUser>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Create and configure the presence channel
    const channel = supabase.channel('platform_presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    // Handle presence sync events
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceUser>();
      const newOnlineUsers = new Map<string, PresenceUser>();
      
      // Process presence state - each key contains an array of presence entries
      Object.entries(state).forEach(([userId, presences]) => {
        if (presences && presences.length > 0) {
          // Take the most recent presence entry
          const latestPresence = presences[presences.length - 1];
          newOnlineUsers.set(userId, latestPresence);
        }
      });
      
      setOnlineUsers(newOnlineUsers);
    });

    // Subscribe and track our presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        
        // Track our presence with user info
        await channel.track({
          user_id: user.id,
          full_name: profile?.full_name || profile?.display_name || null,
          photo_url: profile?.photo_url || null,
          online_at: new Date().toISOString(),
        });
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
      }
    });

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user?.id, profile?.full_name, profile?.display_name, profile?.photo_url]);

  // Update presence when profile changes
  useEffect(() => {
    if (!channelRef.current || !user?.id || !isConnected) return;

    channelRef.current.track({
      user_id: user.id,
      full_name: profile?.full_name || profile?.display_name || null,
      photo_url: profile?.photo_url || null,
      online_at: new Date().toISOString(),
    });
  }, [profile?.full_name, profile?.display_name, profile?.photo_url, user?.id, isConnected]);

  const isOnline = useCallback((userId: string): boolean => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  return {
    onlineUsers,
    onlineCount: onlineUsers.size,
    isOnline,
    isConnected,
  };
}
