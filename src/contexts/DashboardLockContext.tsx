import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface UnlockedUser {
  user_id: string;
  display_name: string;
}

interface DashboardLockContextValue {
  isLocked: boolean;
  lock: () => void;
  unlock: (user?: UnlockedUser) => void;
  lastUnlockedUser?: UnlockedUser;
}

const DashboardLockContext = createContext<DashboardLockContextValue | undefined>(undefined);

export function DashboardLockProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [lastUnlockedUser, setLastUnlockedUser] = useState<UnlockedUser | undefined>();

  const lock = useCallback(() => {
    setIsLocked(true);
  }, []);

  const unlock = useCallback((user?: UnlockedUser) => {
    setIsLocked(false);
    sessionStorage.removeItem('greeting-shown');
    if (user) {
      setLastUnlockedUser(user);
    }
  }, []);

  return (
    <DashboardLockContext.Provider value={{ isLocked, lock, unlock, lastUnlockedUser }}>
      {children}
    </DashboardLockContext.Provider>
  );
}

export function useDashboardLock() {
  const context = useContext(DashboardLockContext);
  if (!context) {
    throw new Error('useDashboardLock must be used within DashboardLockProvider');
  }
  return context;
}
