

## Luxurious Dark Collapsed Sidebar

### What Changes

When the sidebar is collapsed, it transforms into a sleek, black, luxurious rail -- matching the premium "Drop Dead" aesthetic. When expanded, it returns to the normal theme-aware card style.

### Technical Changes

**1. Sidebar outer wrapper** (`src/components/dashboard/DashboardLayout.tsx`, line 863-867)

Add conditional dark styling when `sidebarCollapsed` is true:
- Background: `bg-[hsl(0,0%,6%)]` (near-black) instead of `bg-card/90`
- Border: `border-white/[0.06]` (subtle white edge) instead of `border-border/50`
- Text: force light text with a wrapper class

**2. SidebarNavContent inner wrapper** (`src/components/dashboard/SidebarNavContent.tsx`)

Pass `isCollapsed` to conditionally apply dark-mode overrides on internal elements:

- **Root div** (line 316): Add a conditional class like `sidebar-collapsed-dark` that forces light text colors
- **Logo/initials fallback** (line 331): Switch to light background/dark text when collapsed (`bg-white/10 text-white`)
- **Expand button** (line 353-363): Use `bg-white/10 text-white/60 hover:text-white hover:bg-white/15`
- **Border dividers** (lines 318, 386, 452-453): Use `border-white/[0.06]` when collapsed
- **Nav links** (collapsed icon buttons): Use `text-white/50 hover:text-white hover:bg-white/10` and active state `bg-white/15 text-white`
- **Beta badge** (line 725-730): Keep amber accent but adjust container to `border-amber-500/20 bg-amber-500/10`
- **Footer containers** (lines 740-748): Use `bg-white/[0.04] border-white/[0.06]`
- **Clock/Lock/Feedback buttons**: Override text to `text-white/50 hover:text-white hover:bg-white/10`
- **Popover triggers** in collapsed nav groups: Same white-on-black treatment

**3. Sidebar child components** -- pass a `darkMode` or rely on parent CSS class

The cleanest approach is to add a CSS class `sidebar-collapsed-dark` on the root div of `SidebarNavContent` when collapsed, then define CSS overrides in `index.css` that force light-on-dark colors within that scope. This avoids touching every child component individually.

Add to `src/index.css`:
```css
.sidebar-collapsed-dark {
  --sidebar-fg: 0 0% 100%;
  --sidebar-muted-fg: 0 0% 100% / 0.5;
  color: hsl(0 0% 100% / 0.7);
}
.sidebar-collapsed-dark .text-muted-foreground { color: hsl(0 0% 100% / 0.45); }
.sidebar-collapsed-dark .text-foreground { color: hsl(0 0% 100% / 0.9); }
.sidebar-collapsed-dark .bg-muted\/30 { background: hsl(0 0% 100% / 0.04); }
.sidebar-collapsed-dark .border-border\/50,
.sidebar-collapsed-dark .border-border\/30 { border-color: hsl(0 0% 100% / 0.06); }
.sidebar-collapsed-dark .hover\:bg-muted\/60:hover { background: hsl(0 0% 100% / 0.08); }
.sidebar-collapsed-dark .bg-muted\/50 { background: hsl(0 0% 100% / 0.08); }
.sidebar-collapsed-dark .bg-foreground { background: hsl(0 0% 100% / 0.15); }
.sidebar-collapsed-dark .bg-foreground\/10 { background: hsl(0 0% 100% / 0.1); }
```

### Files Modified

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardLayout.tsx` | Conditional dark bg/border on collapsed sidebar wrapper |
| `src/components/dashboard/SidebarNavContent.tsx` | Add `sidebar-collapsed-dark` class to root when collapsed; adjust logo initials and expand button colors |
| `src/index.css` | CSS overrides for `.sidebar-collapsed-dark` scope |

### Result

- Collapsed sidebar becomes a sleek black rail with subtle white-on-dark icons
- Expanded sidebar remains the normal cream/card theme
- Transition between states is smooth (existing `transition-[width]` handles it)
- The amber Beta badge accent pops against the dark background
- Clock In green accent remains visible
- Luxurious, executive feel that matches the "Drop Dead Premium" brand
