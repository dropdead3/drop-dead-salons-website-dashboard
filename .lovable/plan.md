

# Bring Reference Line Above Bars, Thinner, with Animated Reveal

## Problem
The dashed orange reference line renders behind the bars (SVG paint order issue within the `<Customized>` component), it's too thick at `strokeWidth={2}`, and appears statically without any visual flair.

## Changes

### Both `WeekAheadForecast.tsx` and `ForecastingCard.tsx`

1. **Render line on top of bars** -- The `<Customized>` component already appears after the `<Bar>` elements, but Recharts may still layer it underneath. We'll add a CSS/SVG `style={{ pointerEvents: 'none' }}` and set `z-index` behavior by using `<Customized>` with a higher rendering priority. Specifically, we'll keep the `<Customized>` after the bars (already done) but also ensure proper SVG stacking.

2. **Reduce line boldness** -- Change `strokeWidth` from `2` to `1.5` and adjust `strokeDasharray` from `"6 3"` to `"5 3"` for a subtler, more refined look.

3. **Add animated reveal effect** -- Apply an SVG `stroke-dashoffset` animation using a CSS `<style>` block or inline `style` with `@keyframes`. The line will "draw in" from left to right on mount:
   - Set `strokeDasharray` to the full line length
   - Animate `strokeDashoffset` from the full length to `0` over ~1 second
   - This creates a clean "drawing" effect
   - The badge will fade in with an opacity animation (0 to 1 over 0.5s)

### Technical Detail

For the animated line, we'll calculate the line length (`chartRight - chartLeft - badgeWidth - 4`) and use it as both the `strokeDasharray` and initial `strokeDashoffset`, then animate to `0`:

```tsx
const lineLength = chartRight - (chartLeft + badgeWidth + 4);
<line
  x1={chartLeft + badgeWidth + 4}
  y1={yPos}
  x2={chartRight}
  y2={yPos}
  stroke="hsl(25, 100%, 55%)"
  strokeDasharray={lineLength}
  strokeDashoffset={lineLength}
  strokeWidth={1.5}
  style={{
    animation: 'drawLine 1s ease-out forwards',
  }}
/>
```

A `<style>` element will be injected inside the `<g>` with:
```css
@keyframes drawLine { to { stroke-dashoffset: 0; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
```

The badge `<foreignObject>` will get `style={{ animation: 'fadeIn 0.5s ease-out forwards' }}`.

### Files to edit
- `src/components/dashboard/sales/WeekAheadForecast.tsx` -- daily avg customized block
- `src/components/dashboard/sales/ForecastingCard.tsx` -- daily avg and weekly avg customized blocks
