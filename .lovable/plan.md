

# Visual Connection: Peak Bar to Busiest Day Callout

## Current State
- The peak bar is already colored green (`chart-2`) while other bars are primary/blue
- The "Busiest day" callout below has a green dot and green text
- But there's no explicit visual link between the two -- users have to mentally connect them

## Approach

Add a small star/sparkle icon and "Busiest" micro-label directly above the peak bar (replacing or augmenting the plain dollar label), rendered in the same `chart-2` green color. This creates an unmistakable visual thread: green annotation above bar -> green bar -> green dot + green text in callout below.

### Changes

**Both `WeekAheadForecast.tsx` and `ForecastingCard.tsx`:**

1. **Modify the `AboveBarLabel` component** to accept an `isPeak` flag. When the bar is the peak:
   - Render a small star/sparkle SVG icon above the dollar amount
   - Color the dollar label in `chart-2` green instead of the default foreground
   - This makes the peak bar's label visually distinct and color-matched to the callout

2. **Pass `isPeak` data to the label** via the `LabelList` by using a custom content renderer that checks the entry's `isPeak` property from `chartData`.

3. **Add a subtle downward-pointing triangle** below the peak bar's label (small CSS triangle or SVG polygon in `chart-2` color) to create a "pointing" effect toward the callout section. This acts as a visual arrow saying "this bar is the one referenced below."

### Technical Detail

The `AboveBarLabel` custom content renderer already receives the full entry payload. We'll check `payload.isPeak` and conditionally render the enhanced label:

```tsx
function AboveBarLabel({ x, y, width, value, ...rest }: any) {
  if (!value) return null;
  const isPeak = rest?.isPeak ?? rest?.payload?.isPeak;
  const fillColor = isPeak ? 'hsl(var(--chart-2))' : undefined;
  
  return (
    <g>
      {isPeak && (
        <circle cx={x + width / 2} cy={y - 20} r={3} fill="hsl(var(--chart-2))" />
      )}
      <text
        x={x + width / 2} y={y - 8}
        textAnchor="middle"
        className={cn("text-xs font-medium tabular-nums", isPeak ? "fill-chart-2" : "fill-foreground")}
        style={{ fontWeight: isPeak ? 700 : 500 }}
      >
        ${value.toLocaleString()}
      </text>
    </g>
  );
}
```

The green dot above the peak label + green bar + green dot in the callout row creates a clear color-coded visual chain. No extra wiring needed between the SVG chart and the HTML callout -- the shared color does the work.

### Files to edit
- `src/components/dashboard/sales/WeekAheadForecast.tsx` -- AboveBarLabel + peak callout
- `src/components/dashboard/sales/ForecastingCard.tsx` -- AboveBarLabel + peak callout

