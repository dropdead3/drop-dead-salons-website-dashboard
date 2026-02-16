

# Fix: Secondary Navigation Bar Still Too Bright in Dark Mode

## Problem
The previous change to `bg-muted/40` used too low an opacity (40%), so the bar still appears nearly white in dark mode. The muted background needs to be more opaque and match the dark header aesthetic.

## Solution
In `src/components/dashboard/schedule/ScheduleHeader.tsx` (line 298), change the background from `bg-muted/40` to `bg-muted` (full opacity). This ensures the bar picks up the full dark muted color (22% lightness per your dark mode standards) instead of being washed out by the low opacity.

### File Changed
- `src/components/dashboard/schedule/ScheduleHeader.tsx` line 298: Replace `bg-muted/40 border-x border-b border-border/50` with `bg-muted border-x border-b border-border/50`

