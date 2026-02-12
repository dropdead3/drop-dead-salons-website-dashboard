

# Location Comparison: Scalable Visualization with View Selector

## Overview
Replace the single-color revenue bar with a **user-selectable visualization system** offering three chart types optimized for different scales. Add a rich, diverse color palette derived from the existing service category color system.

## Color Palette

Replace the 5 monochrome primary-opacity colors with a curated palette of 20+ distinct, visually harmonious colors. Source these from:
- The existing `categoryColors.ts` fallback palette (pinks, blues, golds, teals, greens, purples)
- Extended with additional hues for large orgs (coral, indigo, amber, slate, rose, cyan, lime, fuchsia, etc.)

Each location gets a unique, deterministic color assignment based on its sorted index.

## Visualization Options (User Dropdown)

Add a `Select` dropdown next to the existing card/table toggle that lets the user choose their chart type:

### 1. Horizontal Bar Chart (default for 6+ locations)
- Recharts `BarChart` with `layout="vertical"`
- Each location = one horizontal bar, sorted by revenue descending
- Color-coded per location from the palette
- Scrollable via `ScrollArea` for large lists
- Tooltip with location name, revenue, and share %
- Best for: 5-100 locations (ranked comparison)

### 2. Treemap (default suggestion for 100+ locations)
- Recharts `Treemap` component (already available in the installed recharts package)
- Each rectangle = one location, area proportional to revenue
- Color-coded per location
- Labels show location name + revenue (auto-hidden when rectangle is too small)
- Tooltip on hover with full details
- Best for: 20-1,000+ locations (proportional overview at a glance)

### 3. Donut Chart (available for 2-10 locations)
- Recharts `PieChart` with inner radius for donut style
- Each slice = one location
- Center label shows total revenue
- Only offered when location count is 10 or fewer (hidden from dropdown otherwise)
- Best for: small orgs wanting a quick visual split

## Auto-Selection Logic
- 2-5 locations: Default to Donut, all 3 options available
- 6-20 locations: Default to Bar, Bar + Treemap available (Donut hidden)
- 21+ locations: Default to Treemap, Bar + Treemap available

The user's selection persists via `useState` within the component (resets on page reload, which is fine for an analytics view).

## Technical Details

### Files to Create
1. **`src/components/dashboard/sales/location-comparison/LocationBarChart.tsx`**
   - Vertical layout `BarChart` using Recharts
   - Props: locations array, colors, totalRevenue
   - `BlurredAmount`-compatible tooltips
   - Wrapped in `ScrollArea` when locations exceed ~15
   - Entrance animation via `framer-motion`

2. **`src/components/dashboard/sales/location-comparison/LocationTreemap.tsx`**
   - Recharts `Treemap` with custom content renderer
   - Props: locations array, colors
   - Custom cell rendering: location name + abbreviated revenue inside each rectangle
   - Tooltip with full name, revenue, share %, services, products
   - Minimum cell size threshold for label visibility
   - `BlurredAmount` integration

3. **`src/components/dashboard/sales/location-comparison/LocationDonutChart.tsx`**
   - Recharts `PieChart` with `innerRadius`
   - Center text showing total revenue
   - Legend with location names + colors
   - `BlurredAmount` integration

### Files to Modify

4. **`src/components/dashboard/sales/LocationComparison.tsx`**
   - Replace the 5-color `COLORS` array with a 20+ color palette
   - Add a `chartType` state (`'bar' | 'treemap' | 'donut'`) with auto-selection logic
   - Add a `Select` dropdown in the header (next to the card/table toggle) for chart type selection
   - Conditionally render the selected chart component above the table/cards
   - Pass the expanded color palette to all child components

5. **`src/components/dashboard/sales/location-comparison/LocationComparisonTable.tsx`**
   - Update `LocationRevenueBar` usage to be replaced by the selected chart (the bar is moved into the parent)
   - Remove the inline `LocationRevenueBar` reference (chart now lives at parent level)

### Color Palette Definition (in LocationComparison.tsx)
```
const LOCATION_COLORS = [
  '#60a5fa', '#f472b6', '#facc15', '#10b981', '#a78bfa',
  '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#8b5cf6',
  '#ef4444', '#14b8a6', '#eab308', '#6366f1', '#d946ef',
  '#0ea5e9', '#f59e0b', '#22c55e', '#e11d48', '#7c3aed',
];
```

### UX Flow
- The chart type selector appears as a small `Select` component in the card header
- Changing chart type smoothly transitions via `framer-motion` `AnimatePresence`
- The chart sits between the header and the table/cards content
- Table/cards remain below as the detailed data view; charts provide the visual summary

### Privacy
- All revenue values in tooltips and labels wrapped in `BlurredAmount`
- Treemap cell labels use abbreviated amounts when blurred
