import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ChannelWithMembership } from '@/hooks/team-chat/useChatChannels';

interface TeamChatContextType {
  activeChannel: ChannelWithMembership | null;
  setActiveChannel: (channel: ChannelWithMembership | null) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  threadMessageId: string | null;
  openThread: (messageId: string) => void;
  closeThread: () => void;
}

const TeamChatContext = createContext<TeamChatContextType | null>(null);

export function TeamChatProvider({ children }: { children: ReactNode }) {
  const [activeChannel, setActiveChannel] = useState<ChannelWithMembership | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [threadMessageId, setThreadMessageId] = useState<string | null>(null);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    setIsSidebarOpen(open);
  }, []);

  const openThread = useCallback((messageId: string) => {
    setThreadMessageId(messageId);
  }, []);

  const closeThread = useCallback(() => {
    setThreadMessageId(null);
  }, []);

  return (
    <TeamChatContext.Provider
      value={{
        activeChannel,
        setActiveChannel,
        isSidebarOpen,
        toggleSidebar,
        setSidebarOpen,
        threadMessageId,
        openThread,
        closeThread,
      }}
    >
      {children}
    </TeamChatContext.Provider>
  );
}

export function useTeamChatContext() {
  const context = useContext(TeamChatContext);
  if (!context) {
    throw new Error('useTeamChatContext must be used within TeamChatProvider');
  }
  return context;
}
