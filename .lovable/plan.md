
# Polish Platform Sidebar: Hover States, Active Indicators, and Transitions

## Current State

The sidebar already has violet-themed hover states, a 2px active accent bar, and basic `transition-all duration-200`. The polish will refine these into a more premium, fintech-inspired feel without changing the structure.

## Changes

### `src/components/platform/layout/PlatformSidebar.tsx`

**1. Active indicator -- animated accent bar**
- Wrap the accent bar in a `motion.div` (framer-motion) with `layoutId="platform-nav-active"` so it slides between active items instead of popping in/out
- Increase the bar height from `h-4` to `h-5` and add a glow: `shadow-[0_0_6px_rgba(139,92,246,0.4)]` (dark) or `shadow-[0_0_4px_rgba(124,58,237,0.3)]` (light)

**2. Refined hover states**
- Add a subtle left-border preview on hover (non-active items): a 2px transparent-to-violet bar that fades in via `opacity-0 group-hover:opacity-100 transition-opacity`
- Replace the `hover:translate-x-0.5` with a smoother `hover:translate-x-[2px]` and add `hover:shadow-sm` for a lifted feel in light mode
- Add `group` class to each `li` to enable child hover targeting

**3. Smoother transitions**
- Change nav links from `transition-all duration-200` to `transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]` for a more natural curve
- Add `will-change-transform` to prevent jank on translateX
- Sidebar collapse/expand: already `duration-300`, keep as-is

**4. Active item background refinement**
- Dark active: change from `bg-violet-500/15` to `bg-violet-500/10` with a subtle `ring-1 ring-violet-500/20` for definition
- Light active: change from `bg-violet-100/80` to `bg-gradient-to-r from-violet-50 to-violet-100/60` for a premium gradient fill

**5. Icon animations**
- Active icons get a subtle scale: add `scale-110` when active for slight emphasis
- Hover icons: add `group-hover:scale-105 transition-transform` for a micro-interaction

**6. Section labels**
- Add a subtle letter-spacing increase: from default `tracking-wider` to `tracking-[0.15em]`
- Add `transition-colors duration-200` so labels respond to theme changes smoothly

**7. Profile button hover**
- Add `active:scale-[0.98]` for a press feedback
- Add a ring on hover: `hover:ring-1 hover:ring-violet-500/20` (dark) or `hover:ring-violet-300/30` (light)

**8. Collapse toggle button**
- Add `active:scale-90 transition-all duration-150` for tactile press feel
- The floating expand button (collapsed state) gets `hover:shadow-md` and `hover:scale-105`

## Technical Details

- Import `motion` from `framer-motion` (already a dependency)
- Use `layoutId="platform-nav-active"` on the accent bar -- framer-motion will animate its position between nav items automatically
- Add `group` class to each `<li>` element
- All hover pseudo-elements use existing Tailwind utilities -- no custom CSS needed

## Files Modified
- `src/components/platform/layout/PlatformSidebar.tsx`
