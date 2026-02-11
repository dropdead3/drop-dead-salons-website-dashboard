

## Unify Dashboard Icon Colors: Primary with Subtle Warmth

### Overview
Replace the multi-colored rainbow of icon tints across the staff dashboard with a cohesive monochrome system: **primary-colored icons** sitting on **warm muted backgrounds** (bg-muted). This creates a clean, editorial look where icons feel intentional rather than decorative.

### What Changes

**1. Quick Stats Cards** (`src/pages/dashboard/DashboardHome.tsx`, lines ~426-469)
Currently each stat card has a different colored icon container (blue, green, purple, orange). Change all four to:
- Background: `bg-muted` (replaces `bg-blue-500/10`, `bg-green-500/10`, etc.)
- Icon color: `text-primary` (replaces `text-blue-600`, `text-green-600`, etc.)

**2. Hub Quick Links** (`src/components/dashboard/HubQuickLinks.tsx`, lines 26-89)
Currently each hub link has a unique color class (blue, purple, green, amber, rose, etc.). Change all `colorClass` values to a unified:
- `bg-primary/5 text-primary hover:bg-primary/10`

This keeps the hover interaction but removes the rainbow.

**3. Client Engine flame icon** (`src/pages/dashboard/DashboardHome.tsx`, line ~566)
The streak flame icon currently uses `text-orange-500`. Change to `text-primary` to stay in family.

### What Stays the Same
- **Quick Actions section** -- already uses `text-primary` with `bg-primary/10` consistently. No changes needed.
- **Schedule/Tasks section headers** -- use `text-muted-foreground` for utility icons (Clock, etc.). This is correct and stays.
- **Empty state ghost icons** -- use `opacity-20` which is correct editorial styling.
- **Client Engine card** -- the gold gradient container is a deliberate premium accent and stays as-is.

### Files Modified
1. `src/pages/dashboard/DashboardHome.tsx` -- Quick Stats icon colors + flame icon
2. `src/components/dashboard/HubQuickLinks.tsx` -- Hub link color classes

### Technical Details
- All changes use existing Tailwind utilities and CSS variables
- `text-primary` and `bg-muted` are theme-aware, so they automatically adapt to dark mode and custom theme overrides
- No new dependencies or components needed
- Two files, roughly 15 line-level edits total

