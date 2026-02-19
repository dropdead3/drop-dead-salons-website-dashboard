
## Mobile-First Responsive Optimization

### Problem
On mobile (390px), the dashboard has several layout issues:
- Paired analytics cards (e.g., New Bookings + Goal Tracker) display side-by-side, causing severe content crunching and text overflow
- The 160px progress ring in Goal Tracker overflows its container on small screens
- The filter bar controls can wrap awkwardly
- The operations BentoGrid doesn't stack properly on narrow viewports

### Changes

**1. Stack paired cards on mobile** (`src/pages/dashboard/DashboardHome.tsx`)

The card pair container at line 827 currently uses `flex gap-4 items-stretch` with no responsive breakpoint. Update to:
```
flex flex-col md:flex-row gap-4 md:items-stretch
```
This stacks paired cards vertically on mobile and restores side-by-side layout on tablet+.

**2. Responsive progress ring in Goal Tracker** (`src/components/dashboard/sales/GoalTrackerCard.tsx`)

The ring is hardcoded at 160px which overflows on mobile half-cards. Make it responsive:
- Mobile: 120px ring, 8px stroke, `text-2xl` percentage
- Desktop (md+): 160px ring, 10px stroke, `text-3xl` percentage

Use `useIsMobile()` hook to switch between sizes. This keeps the commanding desktop presence while fitting mobile screens.

**3. Mobile-friendly filter bar** (`src/pages/dashboard/DashboardHome.tsx`)

The filter bar area (lines 728-753 and 796-822) has Zura/Announcements buttons and filter controls in a row. On mobile, stack the control groups vertically:
```
flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3
```

**4. BentoGrid mobile stacking** (`src/components/ui/bento-grid.tsx`)

When the grid has more items than `maxPerRow`, it forces two rows side-by-side. Add responsive stacking:
- On mobile, render items in a single-column stack
- On sm+ screens, use the existing row layout

Update the component to accept a `stackOnMobile` behavior or use responsive flex/grid classes.

**5. Operations Quick Stats mobile** (`src/components/dashboard/operations/OperationsQuickStats.tsx`)

Currently uses `BentoGrid maxPerRow={4}` which tries to fit 4+ items in a flex row. On mobile, this crunches. Pass responsive grid classes so cards display as a 2-column grid on mobile.

**6. Goal Tracker stat values mobile sizing** (`src/components/dashboard/sales/GoalTrackerCard.tsx`)

The stat values use `text-base` which was sized for the larger desktop layout. Use `text-sm md:text-base` for a more proportional mobile experience.

### Technical Summary

| File | Change |
|------|--------|
| `src/pages/dashboard/DashboardHome.tsx` | Add `flex-col md:flex-row` to paired card containers; stack filter bar on mobile |
| `src/components/dashboard/sales/GoalTrackerCard.tsx` | Responsive ring size (120px mobile / 160px desktop); responsive text sizing |
| `src/components/ui/bento-grid.tsx` | Add mobile stacking with responsive classes |
| `src/components/dashboard/operations/OperationsQuickStats.tsx` | Mobile-friendly 2-col grid for stat cards |
| `src/components/dashboard/AnalyticsFilterBar.tsx` | Ensure filter controls wrap gracefully on mobile |

### Result
- All analytics cards display full-width on mobile with proper padding
- Progress ring scales down proportionally on small screens
- Filter controls wrap cleanly without horizontal overflow
- No content crunching, spilling, or truncation on any viewport width
