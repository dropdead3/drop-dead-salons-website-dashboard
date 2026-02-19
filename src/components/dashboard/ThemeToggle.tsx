import { Moon, Sun } from 'lucide-react';
import { useDashboardTheme } from '@/contexts/DashboardThemeContext';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useDashboardTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "relative flex items-center h-8 w-[52px] rounded-full p-0.5 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDark
          ? "bg-accent/60 border border-border/50"
          : "bg-accent/40 border border-border/30"
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Track icons */}
      <Sun className={cn(
        "absolute left-1.5 w-3.5 h-3.5 transition-opacity duration-300",
        isDark ? "opacity-30 text-muted-foreground" : "opacity-0"
      )} />
      <Moon className={cn(
        "absolute right-1.5 w-3.5 h-3.5 transition-opacity duration-300",
        isDark ? "opacity-0" : "opacity-30 text-muted-foreground"
      )} />

      {/* Sliding thumb */}
      <span
        className={cn(
          "flex items-center justify-center h-6 w-6 rounded-full shadow-sm transition-all duration-300 ease-in-out",
          isDark
            ? "translate-x-[22px] bg-foreground/10 backdrop-blur-sm"
            : "translate-x-0 bg-background shadow-md"
        )}
      >
        {isDark ? (
          <Moon className="w-3 h-3 text-foreground" />
        ) : (
          <Sun className="w-3 h-3 text-foreground" />
        )}
      </span>
    </button>
  );
}
