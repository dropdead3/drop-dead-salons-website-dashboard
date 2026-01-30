import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

type PlatformTheme = 'light' | 'dark' | 'system';
type ResolvedPlatformTheme = 'light' | 'dark';

interface PlatformThemeContextType {
  theme: PlatformTheme;
  setTheme: (theme: PlatformTheme) => void;
  resolvedTheme: ResolvedPlatformTheme;
}

const PlatformThemeContext = createContext<PlatformThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'platform-theme';

function getSystemTheme(): ResolvedPlatformTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function PlatformThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<PlatformTheme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    }
    return 'dark'; // Default to dark for platform
  });

  const [systemTheme, setSystemTheme] = useState<ResolvedPlatformTheme>(getSystemTheme);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme: ResolvedPlatformTheme = useMemo(() => {
    if (theme === 'system') {
      return systemTheme;
    }
    return theme;
  }, [theme, systemTheme]);

  const setTheme = (newTheme: PlatformTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  };

  const value = useMemo(() => ({
    theme,
    setTheme,
    resolvedTheme,
  }), [theme, resolvedTheme]);

  return (
    <PlatformThemeContext.Provider value={value}>
      {children}
    </PlatformThemeContext.Provider>
  );
}

export function usePlatformTheme() {
  const context = useContext(PlatformThemeContext);
  if (context === undefined) {
    throw new Error('usePlatformTheme must be used within a PlatformThemeProvider');
  }
  return context;
}
