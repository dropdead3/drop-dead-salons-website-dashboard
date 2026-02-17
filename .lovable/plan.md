

## Fix: Handle Gradient Markers in Forecast Bar Colors

### Root Cause

Some service categories (e.g., "New Client Consultation") have their `color_hex` stored as a gradient marker string like `gradient:teal-lime` instead of a plain hex color like `#f5f5dc`. SVG `linearGradient` `stopColor` attributes only accept valid CSS color values, not these custom marker strings. When a gradient marker is passed as `stopColor`, the browser ignores it, resulting in a transparent or missing fill on that bar segment.

### Fix

Add a helper function that resolves a `color_hex` value to a usable hex color for SVG contexts:

- If the value is a plain hex (e.g., `#fbcfe8`), use it directly.
- If the value is a gradient marker (e.g., `gradient:teal-lime`), extract the first color stop from the corresponding `SPECIAL_GRADIENTS` entry in `categoryColors.ts`.

Apply this resolver in both `WeekAheadForecast.tsx` and `ForecastingCard.tsx` wherever `colorMap[cat.toLowerCase()]?.bg` is used to derive SVG gradient stops and stroke colors.

### Files Modified

**`src/components/dashboard/sales/WeekAheadForecast.tsx`**
- Import `isGradientMarker` and `getGradientFromMarker` from `@/utils/categoryColors`
- Add a small helper: `resolveHexColor(colorHex)` that returns plain hex or extracts the first gradient stop color
- Use this helper at line ~342 (gradient defs) and line ~394 (stroke color)

**`src/components/dashboard/sales/ForecastingCard.tsx`**
- Same imports and helper
- Use at line ~700 (gradient defs) and line ~763 (stroke color)

### What the Helper Looks Like

```typescript
function resolveHexColor(colorHex: string): string {
  if (!isGradientMarker(colorHex)) return colorHex;
  const grad = getGradientFromMarker(colorHex);
  if (!grad) return '#888888';
  // Extract first hex from gradient background string
  const match = grad.background.match(/#[0-9a-fA-F]{6}/);
  return match ? match[0] : '#888888';
}
```

### Also Update: Tooltip Color Dots

The tooltip category breakdown also shows color dots. These will also need the same resolver so the dot colors match the bar segments.

### Result

All bar segments will have consistent, visible solid-color glass fills regardless of whether the category uses a plain hex or a gradient marker in settings.
