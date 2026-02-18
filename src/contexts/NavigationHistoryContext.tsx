import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationHistoryContextType {
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
}

const NavigationHistoryContext = createContext<NavigationHistoryContextType | null>(null);

const MAX_HISTORY = 50;

// Module-level state so it survives component remounts
const navState = {
  history: [] as string[],
  currentIndex: -1,
  isInternalNav: false,
};

export function NavigationHistoryProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [, forceRender] = React.useState(0);

  useEffect(() => {
    const fullPath = location.pathname + location.search + location.hash;

    if (navState.isInternalNav) {
      navState.isInternalNav = false;
      return;
    }

    const { history: h, currentIndex: idx } = navState;

    // Slice forward entries and push new
    const newHistory = h.slice(0, idx + 1);
    if (newHistory[newHistory.length - 1] === fullPath) return;
    newHistory.push(fullPath);

    // Cap
    if (newHistory.length > MAX_HISTORY) {
      newHistory.splice(0, newHistory.length - MAX_HISTORY);
    }

    navState.history = newHistory;
    navState.currentIndex = newHistory.length - 1;
    forceRender(c => c + 1);
  }, [location.pathname, location.search, location.hash]);

  const canGoBack = navState.currentIndex > 0;
  const canGoForward = navState.currentIndex < navState.history.length - 1;

  const goBack = useCallback(() => {
    if (navState.currentIndex <= 0) return;
    navState.currentIndex -= 1;
    navState.isInternalNav = true;
    navigate(navState.history[navState.currentIndex]);
    forceRender(c => c + 1);
  }, [navigate]);

  const goForward = useCallback(() => {
    if (navState.currentIndex >= navState.history.length - 1) return;
    navState.currentIndex += 1;
    navState.isInternalNav = true;
    navigate(navState.history[navState.currentIndex]);
    forceRender(c => c + 1);
  }, [navigate]);

  return (
    <NavigationHistoryContext.Provider value={{ canGoBack, canGoForward, goBack, goForward }}>
      {children}
    </NavigationHistoryContext.Provider>
  );
}

export function useNavigationHistory() {
  const ctx = useContext(NavigationHistoryContext);
  if (!ctx) throw new Error('useNavigationHistory must be used within NavigationHistoryProvider');
  return ctx;
}
