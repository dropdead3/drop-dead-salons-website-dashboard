

# More Translucent Bars with Baseline Axis

## Overview
Make the bars feel more like frosted glass by lowering gradient opacities, and add a visible baseline (x-axis line) to ground the chart visually.

## Changes

### 1. Increase translucency of glass gradients
Lower the `stopOpacity` values across all gradients so bars feel more see-through:

**Confirmed bar gradients** (glassPrimary, glassPeak, glassToday):
- Top stop: 0.95 → 0.7
- Mid stop: 0.7 → 0.5
- Bottom stop: 0.55 → 0.35

**Unconfirmed bar gradients** (Light variants):
- Top stop: 0.5 → 0.35
- Bottom stop: 0.25 → 0.15

### 2. Refine stroke styling
Increase stroke visibility slightly to compensate for the more translucent fills:
- Confirmed bars: `strokeOpacity` 0.4 → 0.5
- Unconfirmed bars: `strokeOpacity` 0.3 → 0.4

### 3. Add baseline axis line
On the `<XAxis>` component, change `axisLine={false}` to:
```tsx
axisLine={{ stroke: 'hsl(var(--foreground) / 0.15)', strokeWidth: 1 }}
```
This adds a subtle horizontal line at the bottom of the chart, giving the bars a visual "ground" to sit on.

### File to edit
- `src/components/dashboard/sales/ForecastingCard.tsx`

