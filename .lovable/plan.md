

# Fix Daily Average Reference Line Visibility

## Problem
The horizontal "Daily Avg" dashed reference line and its label text use `hsl(var(--muted-foreground))` which has poor contrast in dark mode -- the line nearly disappears against the dark card background, and the label gets cut off or is hard to read.

## Solution
Use a dedicated, higher-contrast color for the reference line and label that works well in both light and dark modes. We'll use `hsl(var(--foreground))` at reduced opacity for the line stroke, and `hsl(var(--foreground))` for the label text. This ensures the line is always visible regardless of theme.

## Changes

### 1. `src/components/dashboard/sales/ForecastingCard.tsx`
- **Daily average ReferenceLine** (line ~566-579): Change stroke from `hsl(var(--muted-foreground))` to `hsl(var(--foreground) / 0.45)` and label fill to `hsl(var(--foreground) / 0.7))` for better visibility
- **Weekly average ReferenceLine** (line ~583-598): Same changes
- Both lines get slightly increased strokeWidth for visibility

### 2. `src/components/dashboard/sales/WeekAheadForecast.tsx`
- This chart currently has **no ReferenceLine** at all, yet the screenshot shows a dashed line (likely inherited from ForecastingCard). Add a `ReferenceLine` import and render a daily average dashed line using the same improved color values, consistent with ForecastingCard.

### 3. `src/components/dashboard/sales/RevenueForecast.tsx`
- Same color update on its existing `ReferenceLine` (line ~231-234) for consistency across all forecast charts.

## Color Logic
- **Line stroke**: `hsl(var(--foreground) / 0.35)` -- uses the theme's foreground color at 35% opacity, visible on both light and dark backgrounds
- **Label text**: `hsl(var(--foreground) / 0.6)` -- slightly more prominent than the line for readability
- This follows existing theme-aware patterns and automatically adapts to light/dark mode
