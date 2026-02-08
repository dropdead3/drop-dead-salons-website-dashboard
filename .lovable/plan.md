
# Fix Live Preview to Display Correct Light Theme

## Problem Analysis

The Website Editor's Live Preview iframe displays the public website in dark mode when the dashboard is set to dark mode. This happens because:

1. **Shared localStorage**: Both the parent dashboard and iframe share the same origin, meaning localStorage values are shared
2. **next-themes ThemeProvider**: The global `ThemeProvider` from `next-themes` in `App.tsx` applies theme classes to `document.documentElement`
3. **Race conditions**: Even though `Layout.tsx` has code to reset the theme, there may be timing issues with theme application

## Root Cause

Looking at the architecture:
- The iframe loads `/` which runs the full React app
- `App.tsx` wraps everything in `ThemeProvider` from `next-themes`
- `DashboardThemeProvider` stores its state in `dashboard-theme` localStorage key
- The `Layout` component does reset classes in a `useEffect`, but this may run after initial render causes a flash

## Solution

Enhance the preview iframe to pass a query parameter that tells the public site to force light mode, bypassing any stored theme preferences.

### Implementation Steps

#### 1. Update `LivePreviewPanel.tsx`

Add a `?preview=true` query parameter to the iframe src:

```typescript
<iframe
  key={refreshKey}
  src="/?preview=true"  // Add preview flag
  className="w-full h-full border-0"
  title="Website Preview"
  onLoad={() => setIsLoading(false)}
/>
```

#### 2. Update `Layout.tsx`

Check for the `preview` query parameter and force light theme immediately:

```typescript
useEffect(() => {
  const root = document.documentElement;
  
  // Check if we're in preview mode (loaded in iframe from website editor)
  const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
  
  // Force light mode for public website (always, but especially in preview)
  root.classList.remove('dark');
  root.classList.remove('theme-rose', 'theme-sage', 'theme-ocean');
  root.classList.add('theme-cream');
  
  // Clear any custom CSS variable overrides
  // ... existing code ...
}, []);
```

#### 3. Update Index.tsx (Homepage)

Ensure the homepage also respects the preview parameter by wrapping in light theme context if needed.

### Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/website-editor/LivePreviewPanel.tsx` | Add `?preview=true` to iframe src |
| `src/components/layout/Layout.tsx` | Ensure theme reset runs synchronously and respects preview mode |

### Additional Enhancement

Move the theme reset logic to run **before** React render by adding inline styles or using a more aggressive reset:

```typescript
// In Layout.tsx - run reset immediately, not just in useEffect
export function Layout({ children }: LayoutProps) {
  // Immediately force light mode (runs during render, not after)
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('theme-cream');
  }
  
  // ... rest of component
}
```

This ensures the theme is correct from the very first paint, eliminating any flash of incorrect theme colors.

## Summary

| Before | After |
|--------|-------|
| Preview inherits dashboard dark mode | Preview always shows correct light/cream theme |
| Flash of wrong theme on load | Immediate correct theme application |
| Shared theme state causes conflicts | Preview mode bypasses theme persistence |
