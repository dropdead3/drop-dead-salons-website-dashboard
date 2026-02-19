

## Luxurious Dark Sidebar -- Always On

### What Changes

The sidebar becomes permanently black and luxurious in both collapsed and expanded states, rather than only when collapsed. The existing `.sidebar-collapsed-dark` CSS class gets renamed to a universal `.sidebar-dark` class applied unconditionally.

### Technical Changes

**1. DashboardLayout.tsx (line 865-868)**

Remove the conditional background/border. Apply the dark styling always:
```
"lg:bg-[hsl(0,0%,6%)] lg:border-white/[0.06]"
```
Both collapsed (`lg:w-16`) and expanded (`lg:w-72`) get the same near-black background and subtle white border.

**2. SidebarNavContent.tsx (line 316)**

Change `isCollapsed && "sidebar-collapsed-dark"` to always apply the class (renamed to `sidebar-dark`):
```
className={cn("flex flex-col h-full", "sidebar-dark")}
```

Also update the expanded-state elements that currently use theme-aware colors:
- **Logo text** (line 345): Change `text-foreground` to `text-white/90`
- **Collapse button** (line 368): Change from `text-muted-foreground hover:text-foreground` to `text-white/60 hover:text-white`
- **Initials fallback in expanded** (if present): Use same `bg-white/10 text-white` treatment

**3. index.css (lines 1458-1475)**

Rename `.sidebar-collapsed-dark` to `.sidebar-dark` across all selectors. No other CSS changes needed -- the same light-on-dark overrides apply to both states.

### Files Modified

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardLayout.tsx` | Always apply dark bg/border on sidebar wrapper |
| `src/components/dashboard/SidebarNavContent.tsx` | Always apply `sidebar-dark` class; update expanded logo/button colors to white-on-dark |
| `src/index.css` | Rename class from `sidebar-collapsed-dark` to `sidebar-dark` |

### Result

- Sidebar is always a sleek black rail regardless of collapsed/expanded state
- Smooth width transition continues to work
- All nav links, icons, badges, footer buttons render in light-on-dark
- The amber Beta badge and emerald Clock In accents pop against the dark background
- Consistent luxury aesthetic across all sidebar states

