
## Replace Emoji/Character Moon Icons with Lucide SVG Moon

### Problem

Four files use either the `🌙` emoji or `☽` Unicode character for closed-day indicators. These render inconsistently across platforms and don't match the clean Lucide icon style used in the `ClosedBadge` component. The reference screenshot shows the proper outlined crescent moon icon.

### Approach

Since all these moons live inside Recharts SVG elements (`<text>`, `<Customized>`), React components like `<Moon />` cannot be used directly. Instead, render the Lucide Moon SVG path inline as a `<path>` element within a `<g>` group, scaled to the appropriate size.

The Lucide Moon path: `M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z` (24x24 viewBox)

### Changes by File

**1. `src/components/dashboard/sales/CapacityUtilizationCard.tsx`**
- X-axis tick: Replace `🌙 Closed` text with a small SVG moon path (scaled to ~10px) followed by "Closed" text
- Bar overlay in `<Customized>`: Replace `🌙` emoji text element with an SVG moon path (scaled to ~14px)

**2. `src/components/dashboard/analytics/CapacityUtilizationSection.tsx`**
- Same two replacements as above (x-axis tick and bar overlay)

**3. `src/components/dashboard/sales/WeekAheadForecast.tsx`**
- X-axis tick: Replace `☽ Closed` text with SVG moon path + "Closed" text (2 occurrences)
- Bar overlay in `<Customized>`: Replace `🌙` emoji text element with SVG moon path

**4. `src/components/dashboard/sales/ForecastingCard.tsx`**
- X-axis tick: Replace `☽ Closed` text with SVG moon path + "Closed" text (2 occurrences)
- Bar overlay in `<Customized>`: Replace `🌙` emoji text element with SVG moon path

### Rendering Pattern

For x-axis ticks (small, beside "Closed" text):
```xml
<g transform={`translate(${x},${y})`}>
  <!-- moon icon scaled to ~10px -->
  <g transform={`translate(-18, ${dyOffset - 9}) scale(0.42)`}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" 
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="stroke-muted-foreground" />
  </g>
  <text x={4} dy={dyOffset} textAnchor="middle" className="fill-muted-foreground text-[9px]">
    Closed
  </text>
</g>
```

For bar overlays (centered in empty bar space, ~16px):
```xml
<g transform={`translate(${cx - 8}, ${cy - 8}) scale(0.67)`}>
  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" 
        fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="stroke-muted-foreground" style={{ opacity: 0.5 }} />
</g>
```

### Summary

| Location | Before | After |
|----------|--------|-------|
| Capacity x-axis ticks | `🌙 Closed` text | SVG path + "Closed" text |
| Capacity bar overlays | `🌙` emoji | SVG moon path |
| Forecasting x-axis ticks | `☽ Closed` text | SVG path + "Closed" text |
| Forecasting bar overlays | `🌙` emoji | SVG moon path |

All four files get the same consistent Lucide Moon outline icon, matching the `ClosedBadge` component's visual language.
