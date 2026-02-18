

## Align Capacity Utilization Chart with Forecasting Chart Elements

### What's Changing

The Capacity Utilization bar chart currently lacks three visual elements present in the Forecasting card. This plan adds them for consistency.

### 1. X-Axis Line

Add a subtle axis line matching the forecasting chart style.

**File: `src/components/dashboard/sales/CapacityUtilizationCard.tsx`**
- Change `axisLine={false}` to `axisLine={{ stroke: 'hsl(var(--foreground) / 0.15)', strokeWidth: 1 }}`

### 2. Moon Icons in Bar Area for Closed Days

Add a `<Customized>` component (same pattern as ForecastingCard) that renders inline SVG moon paths centered in the bar space for each closed day.

**File: `src/components/dashboard/sales/CapacityUtilizationCard.tsx`**
- Import `Customized` from recharts
- Add a `<Customized>` block inside the `<BarChart>` that iterates through `chartData`, checks `days[index]?.isClosed`, and renders a scaled moon `<path>` at the horizontal center of each closed day's bar slot

### 3. Average Utilization Reference Line + Badge

Add a dashed horizontal reference line at the average utilization percentage across open days, with a styled pill badge (matching the forecasting card's "Daily Operating Avg" badge aesthetic).

**File: `src/components/dashboard/sales/CapacityUtilizationCard.tsx`**
- Compute `avgUtilization` from open days only (exclude closed days)
- Add a `<Customized>` component that:
  - Draws a dashed line at the Y position corresponding to `avgUtilization`
  - Renders a `foreignObject` with a pill badge showing "Avg: XX%"
  - Uses the same warm amber styling as the forecasting card (gold dashed line, translucent amber pill)

### Technical Details

The same changes apply to `CapacityUtilizationSection.tsx` (analytics page version) for consistency.

| Element | Before | After |
|---------|--------|-------|
| X-axis line | Hidden (`axisLine={false}`) | Subtle line matching forecasting |
| Closed day bar area | Transparent bar, no icon | SVG moon path centered in slot |
| Average reference | None | Dashed line + amber pill badge |

### Files Modified
- `src/components/dashboard/sales/CapacityUtilizationCard.tsx`
- `src/components/dashboard/analytics/CapacityUtilizationSection.tsx`
