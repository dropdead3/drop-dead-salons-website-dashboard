
# Luxury Glass Bar Styling for Forecast Chart

## Overview
Upgrade the forecast bar chart bars to have a premium "glass" look with subtle stroke borders and translucent layering, matching the luxury aesthetic of the project.

## Visual Changes

1. **Add a subtle darker stroke to each bar** -- Apply a `stroke` color that is a darker shade of the bar's fill color, with a thin `strokeWidth` of 1. This gives each bar a refined border.

2. **Glass effect via SVG gradient overlays** -- Add a `<defs>` section with linear gradients that create a vertical glass sheen: a subtle white-to-transparent overlay on each bar. This will be applied using `fillOpacity` adjustments and a gradient overlay approach.

3. **Refined opacity values** -- Adjust fill opacities to feel more translucent/frosted rather than flat solid.

## Technical Details

### File: `src/components/dashboard/sales/ForecastingCard.tsx`

**Add SVG gradient definitions** inside the `<BarChart>` (before the bars), defining glass overlay gradients:
```tsx
<defs>
  <linearGradient id="glassOverlay" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="white" stopOpacity={0.25} />
    <stop offset="50%" stopColor="white" stopOpacity={0.05} />
    <stop offset="100%" stopColor="black" stopOpacity={0.1} />
  </linearGradient>
</defs>
```

**Update both `<Bar>` components** (unconfirmed and confirmed) to add stroke properties on each `<Cell>`:

For confirmed bars (main visible bars):
```tsx
<Cell
  key={...}
  fill={...}  // existing color logic
  fillOpacity={entry.isPeak ? 0.85 : (isToday ? 0.85 : 0.7)}
  stroke={entry.isPeak ? 'hsl(var(--chart-2) / 0.6)' : (isToday ? 'hsl(var(--chart-3) / 0.6)' : 'hsl(var(--primary) / 0.6)')}
  strokeWidth={1}
/>
```

For unconfirmed bars (bottom of stack):
```tsx
<Cell
  key={...}
  fill={...}  // existing color logic
  fillOpacity={entry.isPeak ? 0.45 : (isToday ? 0.5 : 0.35)}
  stroke={...} // matching darker stroke
  strokeWidth={1}
/>
```

**Add a glass overlay bar** -- A third `<Bar>` in the same stack with `fill="url(#glassOverlay)"` and `fillOpacity={1}` layered on top using the same `stackId`, using `dataKey="totalRevenue"` but rendered as an overlay. Since Recharts stacks by `stackId`, we'll instead use a separate `<Customized>` component or simply rely on the gradient approach within the existing cells by splitting the fill strategy.

Simpler approach: Instead of a third stacked bar (which would shift the stack), apply the glass effect by giving the top bar (`confirmedRevenue`) a gradient fill directly. Define per-color glass gradients:

```tsx
<defs>
  <linearGradient id="glassPrimary" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.95} />
    <stop offset="40%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
  </linearGradient>
  <linearGradient id="glassPeak" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.95} />
    <stop offset="40%" stopColor="hsl(var(--chart-2))" stopOpacity={0.75} />
    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.6} />
  </linearGradient>
  <linearGradient id="glassToday" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.95} />
    <stop offset="40%" stopColor="hsl(var(--chart-3))" stopOpacity={0.75} />
    <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0.6} />
  </linearGradient>
</defs>
```

Then update confirmed `<Cell>` to use gradient fills:
```tsx
fill={entry.isPeak ? 'url(#glassPeak)' : (isToday ? 'url(#glassToday)' : 'url(#glassPrimary)')}
fillOpacity={1}
stroke={entry.isPeak ? 'hsl(var(--chart-2))' : (isToday ? 'hsl(var(--chart-3))' : 'hsl(var(--primary))')}
strokeOpacity={0.4}
strokeWidth={1}
```

And unconfirmed `<Cell>` similarly but with lower opacity gradient variants.

### Files to edit
- `src/components/dashboard/sales/ForecastingCard.tsx`
