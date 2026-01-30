import { Outlet } from 'react-router-dom';
import { PlatformSidebar } from './PlatformSidebar';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { PlatformThemeProvider, usePlatformTheme } from '@/contexts/PlatformThemeContext';

const SIDEBAR_COLLAPSED_KEY = 'platform-sidebar-collapsed';

function PlatformLayoutInner() {
  const { resolvedTheme } = usePlatformTheme();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved ? JSON.parse(saved) : false;
  });

  // Listen for storage changes to sync sidebar state
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (saved) {
        setCollapsed(JSON.parse(saved));
      }
    };

    // Check periodically for changes (since storage event doesn't fire in same tab)
    const interval = setInterval(handleStorageChange, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className={cn(
        'platform-theme min-h-screen',
        resolvedTheme === 'dark' ? 'platform-dark' : 'platform-light',
        resolvedTheme === 'dark' 
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
          : 'platform-gradient-radial'
      )}
    >
      <PlatformSidebar />
      
      {/* Main Content Area */}
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          collapsed ? 'ml-16' : 'ml-56'
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}

export function PlatformLayout() {
  return (
    <PlatformThemeProvider>
      <PlatformLayoutInner />
    </PlatformThemeProvider>
  );
}
