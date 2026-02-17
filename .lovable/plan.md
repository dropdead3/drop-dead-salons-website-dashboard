

## Remove "Luxury Glass" Gradient from Forecast Bar Charts

### What Changes

Replace the translucent gradient fills with solid, flat category colors on the stacked bar segments in both forecast charts. This eliminates the fading opacity effect that washes out lighter colors (like Haircuts' beige).

### Changes

**`src/components/dashboard/sales/WeekAheadForecast.tsx`**

1. **Remove the `<defs>` block** (lines ~349-360) containing the `linearGradient` definitions entirely.
2. **Update `<Bar>` fill** (line ~389): Change from `url(#${gradientId})` to the resolved solid color directly.
3. **Update `<Cell>` fill** (line ~402): Same -- use the solid color instead of the gradient URL.
4. **Update `<Cell>` stroke** (line ~403): Keep the selection logic but use a lighter opacity of the solid color for the default (non-selected) state, or remove the stroke entirely for unselected bars.

**`src/components/dashboard/sales/ForecastingCard.tsx`**

1. **Remove the `<defs>` block** (lines ~707-717) with gradient definitions.
2. **Update `<Bar>` fill** (line ~758): Solid color.
3. **Update `<Cell>` fill** (line ~771): Solid color.
4. **Update `<Cell>` stroke** (line ~772): Same selection logic, solid color.

### What the Bar Rendering Looks Like After

```typescript
{allCategories.map((cat, catIndex) => {
  const isTopBar = catIndex === allCategories.length - 1;
  const solidColor = resolveHexColor(colorMap[cat.toLowerCase()]?.bg || '#888888');
  return (
    <Bar
      key={cat}
      dataKey={cat}
      stackId="revenue"
      radius={isTopBar ? [4, 4, 0, 0] : [0, 0, 0, 0]}
      isAnimationActive={true}
      animationDuration={800}
      animationEasing="ease-out"
      fill={solidColor}
      // ...onClick, cursor props unchanged
    >
      {/* LabelList unchanged for topBar */}
      {chartData.map((entry, index) => {
        const isSelected = /* ...existing selection logic... */;
        return (
          <Cell
            key={`${cat}-${index}`}
            fill={solidColor}
            stroke={isSelected ? 'hsl(var(--foreground))' : solidColor}
            strokeOpacity={isSelected ? 1 : 0.2}
            strokeWidth={isSelected ? 1.5 : 0.5}
          />
        );
      })}
    </Bar>
  );
})}
```

### Result

- All bar segments render as solid, opaque category colors
- Light/muted colors like Haircuts' beige will be clearly visible
- Selected bar highlight (thicker stroke) still works
- No more washed-out or invisible segments

### Files Modified
- `src/components/dashboard/sales/WeekAheadForecast.tsx`
- `src/components/dashboard/sales/ForecastingCard.tsx`
