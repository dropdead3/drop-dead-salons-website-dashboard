
# Fix: Isolate Dashboard Theme from Public Website

## Problem

The public-facing website (homepage, services, booking, etc.) inherits the dashboard's dark mode and custom theme colors when:
1. A staff member has dark mode enabled in dashboard settings
2. Custom theme color overrides are saved in user preferences
3. The preview iframe in Website Editor displays the wrong theme

This happens because:
- `ThemeInitializer` applies CSS variable overrides to `document.documentElement` (global)
- `DashboardThemeProvider` wraps the entire app including public routes
- The public `Layout` component has no theme isolation

## Solution

Create a clear separation between dashboard themes and public website themes:

### 1. Create `PublicThemeWrapper` Component

Wrap all public routes in a component that:
- Explicitly resets any custom CSS variable overrides
- Forces light mode by excluding the `.dark` class
- Applies the default cream theme class

```typescript
// src/components/layout/PublicThemeWrapper.tsx
export function PublicThemeWrapper({ children }) {
  useEffect(() => {
    // Reset any custom theme variables on public routes
    const root = document.documentElement;
    root.classList.remove('dark');
    // Ensure default theme
    root.classList.add('theme-cream');
  }, []);
  
  return <div className="theme-cream public-website">{children}</div>;
}
```

### 2. Update `ThemeInitializer` to Skip Public Routes

Modify to only apply custom theme overrides when on dashboard routes:

```typescript
const loadCustomTheme = async () => {
  // Skip theme customization on public routes
  if (!window.location.pathname.startsWith('/dashboard')) {
    return;
  }
  // ... rest of existing logic
};
```

### 3. Update `Layout` Component

Wrap the layout with explicit theme isolation:

```typescript
export function Layout({ children }: LayoutProps) {
  // Force light mode for public website
  return (
    <div className="theme-cream" style={{ colorScheme: 'light' }}>
      {/* existing layout */}
    </div>
  );
}
```

### 4. Update `App.tsx` Route Structure

Restructure to separate theme contexts:
- Public routes: Outside `DashboardThemeProvider` or with explicit light mode
- Dashboard routes: Inside `DashboardThemeProvider` with theme switching

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/layout/Layout.tsx` | Add theme isolation wrapper with explicit light mode |
| `src/components/ThemeInitializer.tsx` | Skip theme application on non-dashboard routes |
| `src/App.tsx` | Restructure providers to scope dashboard theme to dashboard routes only |

## Files to Create

| File | Purpose |
|------|--------|
| `src/components/layout/PublicThemeWrapper.tsx` | *(Optional)* Dedicated wrapper for public routes |

---

## Implementation Details

### Layout.tsx Changes

The public website layout will:
1. Add `theme-cream` class to ensure consistent light theme
2. Add inline `colorScheme: 'light'` to prevent system dark mode inheritance
3. Clear any `.dark` class that might be inherited

### ThemeInitializer.tsx Changes

The initializer will:
1. Check `window.location.pathname` before applying custom themes
2. Only apply overrides when on `/dashboard/*` routes
3. On public routes, explicitly remove any existing custom CSS variables

### App.tsx Changes

Move `DashboardThemeProvider` to wrap only dashboard routes:
1. Keep it outside for now but have `ThemeInitializer` check route
2. The `DashboardLayout` already scopes the `.dark` class, so the main fix is in `ThemeInitializer`

---

## Summary

| Before | After |
|--------|-------|
| Custom themes apply globally | Custom themes only apply to dashboard |
| Public website inherits dark mode | Public website always uses light cream theme |
| Preview iframe shows wrong colors | Preview iframe shows correct public appearance |
