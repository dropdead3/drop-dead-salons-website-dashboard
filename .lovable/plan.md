

## Lighten Dark Mode Surface Colors (Keep Black Background)

### What Changes
Adjust the dark mode CSS variables for the Cream theme so the background stays pure black while cards, the nav bar, sidebar, and FAB containers get a slightly lighter fill -- creating a subtle layered depth like the reference screenshot.

### Changes

**`src/index.css` -- Dark Cream theme block (lines 196-250)**

Update these HSL values:

| Token | Current | New | Element affected |
|-------|---------|-----|-----------------|
| `--background` | `0 0% 4%` | `0 0% 4%` | Page background (stays black) |
| `--card` | `0 0% 7%` | `0 0% 11%` | All cards, nav bar, sidebar expanded |
| `--popover` | `0 0% 7%` | `0 0% 11%` | Dropdown menus, popovers |
| `--secondary` | `0 0% 12%` | `0 0% 16%` | Secondary fills, hover states |
| `--muted` | `0 0% 22%` | `0 0% 20%` | Muted backgrounds (slight tune) |
| `--input` | `0 0% 12%` | `0 0% 14%` | Input field backgrounds |
| `--sidebar-background` | `0 0% 6%` | `0 0% 10%` | Sidebar panel |
| `--sidebar-accent` | `0 0% 12%` | `0 0% 16%` | Active sidebar items |

This single CSS variable update will automatically propagate to every component that uses `bg-card`, `bg-secondary`, `bg-popover`, and `bg-sidebar` -- including the top nav bar (which uses `bg-card/80`), all dashboard cards, and the expanded sidebar.

The same adjustments will be mirrored for the Rose, Sage, and Ocean dark themes to keep cross-theme consistency.

### Result
- Background stays rich black (4%)
- Cards and surfaces lift to a visible charcoal (~11%) creating clear layered depth
- Nav bar glass effect becomes more visible against the dark background
- Consistent across all four color themes

### Files Modified
- `src/index.css`
