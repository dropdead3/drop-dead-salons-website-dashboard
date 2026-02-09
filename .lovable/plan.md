
# Fix Dark Theme Context Inconsistency

## Problem Summary

The dashboard has recurring color issues in dark mode because components are reading from two different theme sources:

1. **Correct source**: `useDashboardTheme()` from `@/contexts/DashboardThemeContext` - used by `DashboardLayout`
2. **Incorrect source**: `useTheme()` from `next-themes` - still used by some components

When `SidebarNavContent` uses `next-themes`, it always sees `resolvedTheme === 'light'` because the global ThemeProvider defaults to light mode. This causes the wrong logo (black on dark) to be displayed.

## Solution

Replace all `next-themes` imports inside dashboard components with the dashboard-specific theme context.

## Files to Modify

### 1. `src/components/dashboard/SidebarNavContent.tsx`

**Line 3** - Change import:
```typescript
// FROM:
import { useTheme } from 'next-themes';

// TO:
import { useDashboardTheme } from '@/contexts/DashboardThemeContext';
```

**Line 85** - Change hook usage:
```typescript
// FROM:
const { resolvedTheme } = useTheme();

// TO:
const { resolvedTheme } = useDashboardTheme();
```

### 2. `src/components/team-chat/EmojiPickerPopover.tsx`

**Line 3** - Change import:
```typescript
// FROM:
import { useTheme } from 'next-themes';

// TO:
import { useDashboardTheme } from '@/contexts/DashboardThemeContext';
```

**Line 23** - Change hook usage:
```typescript
// FROM:
const { resolvedTheme } = useTheme();

// TO:
const { resolvedTheme } = useDashboardTheme();
```

### 3. `src/pages/dashboard/DesignSystem.tsx`

**Line 16** - Change import:
```typescript
// FROM:
import { useTheme } from "next-themes";

// TO:
import { useDashboardTheme } from "@/contexts/DashboardThemeContext";
```

**Line 51** - Change hook usage:
```typescript
// FROM:
const { theme, setTheme } = useTheme();

// TO:
const { theme, setTheme, resolvedTheme } = useDashboardTheme();
```

## Technical Details

### Why This Happens

The app has two theme providers:
- **Global `ThemeProvider`** (next-themes) in `App.tsx` - set to `defaultTheme="light"` with `enableSystem={false}`
- **Dashboard `DashboardThemeProvider`** - respects system preference and user choice

When `DashboardLayout` applies the `.dark` class using `useDashboardTheme()`, components using `next-themes` don't see this change because `next-themes` isn't aware of the dashboard context.

### The Logo Logic

```typescript
const getLogo = () => {
  const isDark = resolvedTheme === 'dark';
  const customLogo = isDark ? businessSettings?.logo_dark_url : businessSettings?.logo_light_url;
  const fallbackLogo = isDark ? LogoWhite : Logo;
  return customLogo || fallbackLogo;
};
```

When `resolvedTheme` incorrectly returns `'light'`:
- `Logo` (black, `fill="#000000"`) is selected
- On a dark background, black logo is invisible

### SVG Files Reference

- `src/assets/drop-dead-logo.svg` - Black logo for light backgrounds
- `src/assets/drop-dead-logo-white.svg` - White logo for dark backgrounds

## Benefits

1. **Single source of truth** - All dashboard components use the same theme context
2. **Correct logo selection** - Dark mode will correctly display white logos
3. **Consistent behavior** - Text, borders, and all theme-aware elements will respond correctly
4. **Future-proof** - New dashboard components will follow the correct pattern

## No Changes Needed

- `src/components/ui/sonner.tsx` - Uses `next-themes` correctly for toast theming (not dashboard-specific)
