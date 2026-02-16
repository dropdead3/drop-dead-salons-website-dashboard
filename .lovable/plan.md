

# Fix: Utilization Bar Dark Mode Contrast

## Problem
The Schedule utilization bar (the white strip between the header and the calendar grid) uses `bg-card` which resolves to bright white in dark mode, creating a jarring contrast.

## Solution
Change the background of `ScheduleUtilizationBar.tsx` (line 81) from `bg-card border border-border` to `bg-muted/40 border border-border/50`. This uses the muted fill (which is set to 22% lightness in dark mode per the dark mode standards) at 40% opacity, producing a soft gray that blends naturally with the dark UI.

## File Changed
- `src/components/dashboard/schedule/ScheduleUtilizationBar.tsx` (line 81): Replace `bg-card border border-border` with `bg-muted/40 border border-border/50`

