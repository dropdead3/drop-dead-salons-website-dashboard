

## Revert Expanded Sidebar to Light, Keep Collapsed Dark

### Problem
The expanded sidebar is currently always dark. You want only the collapsed rail to stay dark/luxurious, with the expanded state returning to the light cream aesthetic with dark logos.

### Changes

**1. `src/components/dashboard/DashboardLayout.tsx` (line 866)**

Make the dark background conditional on collapsed state again:

```
sidebarCollapsed
  ? "lg:bg-[hsl(0,0%,6%)] lg:border-white/[0.06]"
  : "lg:bg-card/80 lg:backdrop-blur-xl lg:backdrop-saturate-150 lg:border-border/50"
```

**2. `src/components/dashboard/SidebarNavContent.tsx` (line 309)**

Apply `sidebar-dark` class only when collapsed:

```
className={cn("flex flex-col h-full", isCollapsed && "sidebar-dark")}
```

**3. `src/components/dashboard/SidebarNavContent.tsx` -- Logo/icon helpers (lines 169-185)**

Restore theme-aware logic using `resolvedTheme`:
- `hasCustomLogo`: check both `logo_light_url` and `logo_dark_url` based on theme
- `getLogo`: return light logo (dark text) in light mode, dark logo (white text) in dark mode
- `hasCustomIcon`: same pattern
- `getIcon`: same pattern

Collapsed state always uses dark variants (white logos) since the rail is always dark. Expanded state uses theme-resolved variants.

Since expanded is now light, the expanded logo/icon calls will pass `isCollapsed` to decide which variant to use.

**4. `src/components/dashboard/SidebarNavContent.tsx` -- Expanded header colors (lines 338, 361)**

Revert expanded-state text colors back to theme-aware:
- Logo fallback text: `text-foreground` instead of `text-white/90`
- Collapse button: `text-muted-foreground hover:text-foreground` instead of `text-white/60 hover:text-white`

### Files Modified

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardLayout.tsx` | Conditional dark bg only when collapsed |
| `src/components/dashboard/SidebarNavContent.tsx` | Conditional `sidebar-dark` class; theme-aware logos; restore light-mode text colors for expanded state |

### Result
- Collapsed rail stays sleek black with white icons
- Expanded sidebar returns to the cream/light card aesthetic
- Dark logos display correctly against the light expanded background
- Smooth transition between states preserved

