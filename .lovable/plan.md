

# Fix: Secondary Navigation Bar Dark Mode Appearance

## Problem
The secondary navigation bar (containing "Week", "Day", "Today", "Sun", "Mon", etc.) still appears too bright in dark mode. Even with `bg-muted` applied, the bar doesn't blend well with the dark header above it.

## Root Cause
The `bg-muted` class resolves to `hsl(0 0% 22%)` in dark cream mode, which should appear as dark gray. However, it creates a visible contrast gap between the nearly-black header bar above (`bg-foreground`, ~4-8% lightness) and this bar at 22% lightness. The result feels "bright" relative to its surroundings.

## Solution
Replace `bg-muted` with a darker background that visually continues the header bar. Use `bg-card` (which is `0 0% 7%` in dark mode -- very close to the header) combined with a subtle bottom border. This makes the secondary nav feel like a natural extension of the header rather than a separate, lighter strip.

Alternatively, use `bg-background` (0 0% 4%) or `bg-foreground/10` for an even tighter match.

### Recommended approach
Change line 298 in `ScheduleHeader.tsx`:
- From: `bg-muted border-x border-b border-border/50`
- To: `bg-card border-x border-b border-border/50`

This uses `bg-card` which is:
- Light mode: `hsl(0 0% 100%)` -- white (matches current light mode look)
- Dark mode: `hsl(0 0% 7%)` -- near-black (matches the dark header aesthetic)

### File Changed
- `src/components/dashboard/schedule/ScheduleHeader.tsx` (line 298)

