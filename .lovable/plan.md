

# Fix: Main Schedule Header Bar White in Dark Mode

## Problem
The main header bar (containing the Week/Day toggle, date display, location filters, and settings icon) uses `bg-foreground text-background`. In light mode, `foreground` is dark (8% lightness) so this looks like a sleek dark bar. But in dark mode, `foreground` flips to light cream (92% lightness), making the bar appear bright white -- the opposite of what you want.

## Root Cause
The `bg-foreground` / `text-background` pattern is an "inverted" design that only works correctly in light mode. In dark mode the values swap, so the bar becomes light instead of dark.

## Solution
Replace the inverted color pattern with one that stays dark in both modes. Use `bg-[hsl(0,0%,8%)]` (a fixed near-black) with `text-[hsl(40,20%,92%)]` (fixed cream text). This ensures the header bar always appears as a dark, premium-feeling strip regardless of theme mode.

Alternatively, a more theme-token-friendly approach: use `dark:bg-card` combined with light-mode `bg-foreground` so the bar picks up the 7%-lightness card color in dark mode. However, the fixed-color approach is simpler and guarantees consistency.

### Recommended approach
In `src/components/dashboard/schedule/ScheduleHeader.tsx` (line 97), change:
- From: `bg-foreground text-background`
- To: `bg-[hsl(0,0%,8%)] text-[hsl(40,20%,92%)]`

This keeps the bar permanently dark with cream text in both light and dark modes.

### Cascading text color references
Several child elements inside this header use `text-background/70`, `text-background`, `hover:text-background`, `bg-background/10`, etc. These will also need updating to use the fixed cream color references so buttons and icons remain visible. Specifically:
- Replace `text-background` references with `text-[hsl(40,20%,92%)]`
- Replace `text-background/70` with `text-[hsl(40,20%,92%)]/70`
- Replace `bg-background/10` with `bg-[hsl(40,20%,92%)]/10`
- Replace `bg-background/15` with `bg-[hsl(40,20%,92%)]/15`
- Replace `bg-background/20` with `bg-[hsl(40,20%,92%)]/20`
- Replace `border-background/20` with `border-[hsl(40,20%,92%)]/20`

### Files Changed
- `src/components/dashboard/schedule/ScheduleHeader.tsx` -- lines 97 and all child element color references within the header bar (approximately lines 97-294)

