

## Beautify Solid Bars with Luxury Glass Gradient + Glass Stroke

### What's Changing

The flat black solid bars in "Solid" mode will get the same luxury glass treatment used throughout other charts -- a subtle gray gradient fill (top-to-bottom opacity fade) with a translucent glass-style stroke outline.

### Visual Effect

```text
Before:  Flat solid black bars, no depth
After:   Subtle gray gradient (0.85 opacity at top fading to 0.45 at bottom)
         + 1px translucent white/border stroke for glass edge
         + slightly increased border radius for polish
```

### Technical Details

**Files to modify:**

| File | Change |
|------|--------|
| `src/components/dashboard/sales/WeekAheadForecast.tsx` | Add SVG `<defs>` with a vertical linear gradient for the solid bar, update `<Cell>` fill to reference the gradient, add glass stroke styling |
| `src/components/dashboard/sales/ForecastingCard.tsx` | Same treatment -- SVG gradient defs + glass stroke on solid bars |

**Implementation per file:**

1. Inside the `<BarChart>` (via Recharts `<Customized>` or injected before the `<Bar>`), add SVG `<defs>`:
   - A `linearGradient` id `"solid-glass"` going top-to-bottom with the primary color at ~0.85 opacity fading to ~0.45
   - A secondary lighter gradient for the glass sheen highlight

2. Update each `<Cell>` in solid mode:
   - `fill` changes from `"hsl(var(--primary))"` to `"url(#solid-glass)"`
   - `stroke` changes to a subtle white/border translucent stroke: `"hsl(var(--foreground) / 0.12)"` (glass edge)
   - `strokeWidth` set to `1` for the glass outline effect
   - Selected state keeps the stronger foreground stroke

3. Bar `radius` stays `[4, 4, 0, 0]` (already correct for the rounded-top, flat-bottom pattern)

This matches the existing luxury glass language: translucent gradient fills (0.85 to 0.45 opacity), subtle 1px glass outline strokes, and consistent with the ServicePopularityChart and other chart patterns already in the codebase.
