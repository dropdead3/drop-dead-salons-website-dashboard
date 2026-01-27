
# Scope Dashboard Dark Mode to Backend Only

## Problem

Currently, when a user toggles dark mode in the dashboard Settings (Appearance section), the `.dark` class is added to the `<html>` element. This affects **all pages** including the public website because:

1. `ThemeProvider` from `next-themes` wraps the entire app in `App.tsx:91`
2. Tailwind is configured with `darkMode: ["class"]` targeting any `.dark` ancestor
3. CSS variables in `index.css` define both light and dark variants (`:root` vs `.dark`)

## Solution: Dashboard-Scoped Dark Mode

Instead of applying `.dark` to the `<html>` element, we'll scope it to a wrapper around dashboard routes only. The public website will always remain in light mode.

### Architecture

```text
Current (Global):
┌─────────────────────────────────┐
│ <html class="dark">             │ ← Theme class here affects ALL pages
│   ├── Public Website            │ ← Incorrectly shows dark mode
│   └── Dashboard                 │ ← Correctly shows dark mode
└─────────────────────────────────┘

New (Scoped):
┌─────────────────────────────────┐
│ <html>                          │ ← No theme class on root
│   ├── Public Website            │ ← Always light mode
│   └── <div class="dark">        │ ← Theme class scoped to dashboard
│         └── Dashboard           │ ← Shows dark mode
└─────────────────────────────────┘
```

## Implementation Steps

### Step 1: Create Dashboard Theme Context

Create a new context specifically for dashboard theme management that:
- Stores theme preference in localStorage with a dashboard-specific key
- Provides `theme` and `setTheme` for dashboard components
- Does NOT use `next-themes` (which targets the html element)

**File: `src/contexts/DashboardThemeContext.tsx`**
```tsx
// Custom context for dashboard-only theme
// Stores preference in localStorage: 'dashboard-theme'
// Returns { theme, setTheme, resolvedTheme }
```

### Step 2: Update DashboardLayout to Apply Scoped Theme

Modify `DashboardLayout.tsx` to:
1. Wrap its content in a div that receives the `.dark` class when dark mode is active
2. Use the new `DashboardThemeContext` instead of `useTheme` from `next-themes`
3. Apply the theme class to this wrapper div, not the html element

**File: `src/components/dashboard/DashboardLayout.tsx`**
```tsx
// Before: Uses global useTheme from next-themes
const { resolvedTheme } = useTheme();

// After: Uses dashboard-scoped context
const { resolvedTheme } = useDashboardTheme();

// Wrap entire dashboard content
return (
  <div className={cn(resolvedTheme === 'dark' && 'dark')}>
    {/* existing dashboard content */}
  </div>
);
```

### Step 3: Update Dashboard Theme Toggle

Modify the Appearance section in Settings to use the new dashboard theme context:

**File: `src/pages/dashboard/admin/Settings.tsx`**
```tsx
// Before: Uses setTheme from next-themes (global)
const { theme, setTheme } = useTheme();

// After: Uses dashboard-scoped context
const { theme, setTheme } = useDashboardTheme();
```

### Step 4: Update Tailwind Config for Scoped Dark Mode

Modify `tailwind.config.ts` to use a CSS selector that matches our scoped approach:

**File: `tailwind.config.ts`**
```ts
// Already uses class strategy, but we need to ensure
// the .dark class works when applied to a parent div, not just html
darkMode: ["class"],  // No change needed - already scopes to any .dark ancestor
```

### Step 5: Ensure Public Website Ignores Dashboard Theme

The public website `Layout.tsx` already doesn't have any theme toggle UI. After our changes:
- Public pages will always render with light mode CSS variables
- The `ThemeProvider` from `next-themes` can be removed or kept at "light" default
- No changes needed to public components

### Step 6: Update ThemeInitializer for Dashboard Scope

Modify `ThemeInitializer.tsx` to only apply custom theme overrides within dashboard context:

**File: `src/components/ThemeInitializer.tsx`**
- Keep existing behavior for custom color/typography overrides
- These CSS variable injections are fine as they're user-specific branding
- The light/dark mode switch is what needs scoping (handled above)

## Files to Create

| File | Purpose |
|------|---------|
| `src/contexts/DashboardThemeContext.tsx` | Dashboard-specific theme state and localStorage sync |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/DashboardLayout.tsx` | Wrap content with scoped `.dark` class, use new context |
| `src/pages/dashboard/admin/Settings.tsx` | Use `useDashboardTheme` instead of `useTheme` |
| `src/App.tsx` | Add `DashboardThemeProvider` wrapper, optionally simplify global ThemeProvider |

## Technical Details

### DashboardThemeContext Implementation

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface DashboardThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const STORAGE_KEY = 'dashboard-theme';

export function DashboardThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(STORAGE_KEY) as Theme) || 'light';
    }
    return 'light';
  });

  const resolvedTheme = theme === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  };

  return (
    <DashboardThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </DashboardThemeContext.Provider>
  );
}
```

### DashboardLayout Wrapper

```tsx
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { resolvedTheme } = useDashboardTheme();
  
  return (
    <div className={cn(
      "min-h-screen", 
      resolvedTheme === 'dark' && 'dark'
    )}>
      {/* All existing sidebar, topnav, main content */}
    </div>
  );
}
```

## User Experience

| Scenario | Before | After |
|----------|--------|-------|
| User enables dark mode in dashboard | Entire app goes dark including public website | Only dashboard goes dark |
| Public visitor browses website | May see dark mode if admin last set dark | Always sees light mode |
| User logs out while in dark mode | Public pages remain dark until cleared | Public pages always light |

## Benefits

1. **Brand Consistency**: Public website maintains intended light aesthetic
2. **Independence**: Dashboard preferences don't affect customer experience
3. **Clean Separation**: Backend staff can work in dark mode without affecting visitors
4. **Existing Features Preserved**: Color themes (cream, rose, sage, ocean) continue working
