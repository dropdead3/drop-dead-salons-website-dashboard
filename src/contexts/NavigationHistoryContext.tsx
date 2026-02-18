import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationHistoryContextType {
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
}

const NavigationHistoryContext = createContext<NavigationHistoryContextType | null>(null);

const MAX_HISTORY = 50;

export function NavigationHistoryProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [history, setHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isInternalNav = useRef(false);

  useEffect(() => {
    const fullPath = location.pathname + location.search + location.hash;

    if (isInternalNav.current) {
      isInternalNav.current = false;
      return;
    }

    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      // Deduplicate consecutive
      if (newHistory[newHistory.length - 1] === fullPath) return newHistory;
      const updated = [...newHistory, fullPath];
      // Cap at MAX_HISTORY
      if (updated.length > MAX_HISTORY) {
        const trimmed = updated.slice(updated.length - MAX_HISTORY);
        setCurrentIndex(trimmed.length - 1);
        return trimmed;
      }
      setCurrentIndex(updated.length - 1);
      return updated;
    });
  }, [location.pathname, location.search, location.hash]);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    const newIndex = currentIndex - 1;
    isInternalNav.current = true;
    setCurrentIndex(newIndex);
    navigate(history[newIndex]);
  }, [canGoBack, currentIndex, history, navigate]);

  const goForward = useCallback(() => {
    if (!canGoForward) return;
    const newIndex = currentIndex + 1;
    isInternalNav.current = true;
    setCurrentIndex(newIndex);
    navigate(history[newIndex]);
  }, [canGoForward, currentIndex, history, navigate]);

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
