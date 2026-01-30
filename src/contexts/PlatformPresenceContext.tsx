import { createContext, useContext, ReactNode } from 'react';
import { usePlatformPresence } from '@/hooks/usePlatformPresence';

interface PresenceUser {
  user_id: string;
  full_name: string | null;
  photo_url: string | null;
  online_at: string;
}

interface PlatformPresenceContextType {
  onlineUsers: Map<string, PresenceUser>;
  onlineCount: number;
  isOnline: (userId: string) => boolean;
  isConnected: boolean;
}

const PlatformPresenceContext = createContext<PlatformPresenceContextType | null>(null);

export function PlatformPresenceProvider({ children }: { children: ReactNode }) {
  const presence = usePlatformPresence();

  return (
    <PlatformPresenceContext.Provider value={presence}>
      {children}
    </PlatformPresenceContext.Provider>
  );
}

export function usePlatformPresenceContext() {
  const context = useContext(PlatformPresenceContext);
  if (!context) {
    throw new Error('usePlatformPresenceContext must be used within PlatformPresenceProvider');
  }
  return context;
}
