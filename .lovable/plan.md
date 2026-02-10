

# Clean Up Duplicate Card Headers & Fix Sidebar Layout

## Problem
1. **Duplicate titles**: The sidebar in `AggregateSalesCard` renders section headers ("TOP PERFORMERS", "REVENUE MIX") *above* the `TopPerformersCard` and `RevenueDonutChart` components, which each render their *own* card headers ("Top Performers", "Revenue Breakdown") internally -- resulting in each title appearing twice.
2. **Wasted vertical space**: The two sidebar cards are stacked with `space-y-4` but don't fill the available height next to the main content area, leaving a visible gap below them.

## Solution

### 1. Remove duplicate external section headers
In `AggregateSalesCard.tsx` (lines 527-544), remove the outer `<h3>` labels for "TOP PERFORMERS" and "REVENUE MIX" since both child components already have their own `CardHeader` with icon, title, and pin toggle.

### 2. Make sidebar cards fill the available height
Change the sidebar container from `space-y-4` to a flex column layout where both cards share the vertical space evenly, eliminating the gap below them. The `TopPerformersCard` and `RevenueDonutChart` will each get `flex-1` so they stretch to fill the sidebar height.

## Technical Details

### File: `src/components/dashboard/AggregateSalesCard.tsx`
- **Lines 526-545**: Replace the sidebar markup:
  - Remove the wrapping `<div>` + `<h3>` around each component
  - Change container from `space-y-4` to `flex flex-col gap-4`
  - Add `flex-1 min-h-0` to each card wrapper so they distribute height evenly
- Move the `MetricInfoTooltip` for Top Performers into the card itself (it's already there via `showInfoTooltip` or the internal header)

### File: `src/components/dashboard/sales/TopPerformersCard.tsx`
- No changes needed -- it already renders its own header with icon + title

### File: `src/components/dashboard/sales/RevenueDonutChart.tsx`
- No changes needed -- it already renders its own header with icon + title

