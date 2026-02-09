import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DashboardLockContextValue {
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
}

const DashboardLockContext = createContext<DashboardLockContextValue | undefined>(undefined);

export function DashboardLockProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);

  const lock = useCallback(() => {
    setIsLocked(true);
  }, []);

  const unlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  return (
    <DashboardLockContext.Provider value={{ isLocked, lock, unlock }}>
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
