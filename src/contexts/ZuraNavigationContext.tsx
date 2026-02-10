import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SuggestedTask } from '@/hooks/useAIInsights';

interface GuidanceState {
  type: 'insight' | 'action';
  title: string;
  description: string;
  category?: string;
  priority?: string;
}

interface SavedZuraState {
  guidance: GuidanceState;
  guidanceText: string;
  suggestedTasks?: SuggestedTask[];
}

interface ZuraNavigationContextValue {
  savedState: SavedZuraState | null;
  saveAndNavigate: (href: string, state: SavedZuraState) => void;
  restore: () => SavedZuraState | null;
  dismiss: () => void;
}

const ZuraNavigationContext = createContext<ZuraNavigationContextValue | null>(null);

const AUTO_DISMISS_MS = 5 * 60 * 1000; // 5 minutes

export function ZuraNavigationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [savedState, setSavedState] = useState<SavedZuraState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setSavedState(null);
  }, [clearTimer]);

  const saveAndNavigate = useCallback((href: string, state: SavedZuraState) => {
    clearTimer();
    setSavedState(state);
    timerRef.current = setTimeout(() => setSavedState(null), AUTO_DISMISS_MS);
    navigate(href);
  }, [navigate, clearTimer]);

  const restore = useCallback(() => {
    clearTimer();
    const state = savedState;
    setSavedState(null);
    return state;
  }, [savedState, clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return (
    <ZuraNavigationContext.Provider value={{ savedState, saveAndNavigate, restore, dismiss }}>
      {children}
    </ZuraNavigationContext.Provider>
  );
}

export function useZuraNavigation() {
  const ctx = useContext(ZuraNavigationContext);
  if (!ctx) throw new Error('useZuraNavigation must be used within ZuraNavigationProvider');
  return ctx;
}

/** Safe version that returns null when outside provider */
export function useZuraNavigationSafe() {
  return useContext(ZuraNavigationContext);
}
