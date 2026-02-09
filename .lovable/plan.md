
# Fix: Render Daily Average Line On Top of Bars

## Problem
The orange dashed "Daily Avg" reference line renders behind the bars because in Recharts, SVG elements are painted in order — elements declared first appear behind later ones. Currently the `ReferenceLine` is placed before the `Bar` components.

## Solution
Move the `ReferenceLine` components to appear **after** the `Bar` components in both chart files. This ensures the orange line renders on top of all bars.

## Changes

### 1. `src/components/dashboard/sales/WeekAheadForecast.tsx`
- Move the `ReferenceLine` block (lines 229-244) to after the last `</Bar>` (after line 293), just before `</BarChart>`

### 2. `src/components/dashboard/sales/ForecastingCard.tsx`
- Move the daily average `ReferenceLine` block (lines 571-587) and the weekly average `ReferenceLine` block (lines 589-605) to after the last `</Bar>` (after line 654), just before `</BarChart>`

No styling or margin changes needed — just reordering the JSX elements within each `BarChart`.
