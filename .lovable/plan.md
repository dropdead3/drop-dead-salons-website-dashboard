
# Refine Daily Average Label and Reference Line

## What's Changing

The "Daily Avg: $1,191" label will get a subtle frosted-glass background badge so it's easy to read even when overlapping bars. The dashed reference line will only start after the label text ends (to the right of it), keeping the layout clean and uncluttered.

## Technical Approach

Recharts' built-in `ReferenceLine` label doesn't support custom backgrounds or partial-width lines. We need a **custom label component** rendered via the `label` prop, and a **customized line segment**.

### Changes to both `WeekAheadForecast.tsx` and `ForecastingCard.tsx`

1. **Create a custom label renderer** -- a small React component that renders an SVG `<foreignObject>` containing an HTML `<span>` with:
   - The "Daily Avg: $X,XXX" text
   - A glass-effect background: `backdrop-blur-sm bg-background/70 border border-border/30 rounded px-1.5 py-0.5`
   - Orange text color matching the current `hsl(25, 100%, 55%)`
   - Positioned at the top-left of the chart area (y = reference line value)

2. **Replace the ReferenceLine with a custom approach** -- use Recharts' `customized` prop or a `<ReferenceLine>` with `label` set to the custom component, and adjust the line's `x1` offset so it starts after the badge width (~130px). Alternatively, use Recharts' `ReferenceArea` or a `customized` element to draw only a partial dashed line starting after the label.

   The simplest clean approach: use a Recharts `<Customized>` component that renders both the badge and the partial line in one SVG group, using the chart's internal coordinate system (`yAxisMap`, `xAxisMap`).

3. **Specifics**:
   - Remove the existing `<ReferenceLine>` blocks
   - Add a `<Customized>` component (from recharts) that:
     - Reads `yAxisMap` and `xAxisMap` from props to calculate the y-pixel position of the average value
     - Renders a `<foreignObject>` with the glass-badge label at the left
     - Renders a `<line>` element starting ~140px from the left edge to the right edge, dashed, in the orange color
   - The badge will have: `fontSize: 11px`, `fontWeight: 600`, subtle glass background

4. **Apply to weekly average** in `ForecastingCard.tsx` as well with the same pattern ("Weekly Avg: $X,XXX").

### Visual Result
- A small, readable glass-effect badge sitting at the top-left of the chart saying "Daily Avg: $1,191"
- A dashed orange line extending from just after the badge to the right edge of the chart
- No overlap or collision between the label text and the line
- Clean, polished, modern look
