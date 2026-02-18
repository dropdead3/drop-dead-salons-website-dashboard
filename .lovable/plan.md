

## Move Service Mix from Capacity Utilization to Forecasting Card (By Category Mode)

### Rationale
The Service Mix donut shows revenue/time distribution across service categories. This is a **category insight**, not a capacity insight. The Capacity Utilization card should focus purely on how much available time is booked vs. open. The Forecasting cards already have a "By Category" toggle that breaks bars into service categories -- showing the Service Mix summary below the chart in that mode creates a cohesive category-focused view.

### Changes

**1. Remove Service Mix from `CapacityUtilizationCard.tsx` (Sales)**
- Remove the `pieData` computation and `showPieChart` variable
- Remove the entire "Service Mix Breakdown" section (donut + legend, roughly lines 492-537)
- Clean up unused imports (PieChart icon from lucide, Pie/Cell/RePieChart from recharts if no longer used)
- The `serviceMix` data from the hook can remain destructured but unused, or be removed from destructuring

**2. Remove Service Mix from `CapacityUtilizationSection.tsx` (Analytics)**
- Same removal: `pieData`, `showPieChart`, and the Service Mix donut section (roughly lines 471-518)
- Clean up unused imports

**3. Add Service Mix summary to `ForecastingCard.tsx`**
- When `chartMode === 'category'`, render a compact Service Mix summary below the bar chart
- Reuse the existing `byCategory` data already available in the forecasting hook response
- Display as a horizontal legend-style layout: small colored dots + category name + percentage, matching the existing category color system
- Wrap in a subtle divider and conditional render (`chartMode === 'category'` and categories exist)

**4. Add Service Mix summary to `WeekAheadForecast.tsx`**
- Same treatment as ForecastingCard: show the category breakdown below the chart when in "By Category" mode
- Uses the same `byCategory` data already destructured from the hook

### Visual Design
- Appears below the bar chart, above the opportunity callout (if any)
- Compact single row or two-column layout with colored dots, category names, and percentage labels
- Uses existing `colorMap` from `useServiceCategoryColorsMap` for consistency with the stacked bars
- Separated from the chart by the standard gradient divider line

### No Database or Hook Changes
All data is already available in both the capacity and forecasting hooks. This is purely a UI reorganization.
