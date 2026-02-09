

# Fix Reference Line: Remove Halo, Make Dotted, Connect to Badge

## Changes

Three visual fixes to the daily and weekly average reference lines in `ForecastingCard.tsx`:

1. **Remove the halo stroke** -- Delete the background-colored `<line>` elements (the thick `strokeWidth={5}` lines) that create the "halo" effect behind the reference lines. These are visually distracting.

2. **Make the line dotted (not solid or animated-solid)** -- Replace the current `strokeDasharray={lineLength}` (which is an animation trick for a solid draw-in) with an actual dotted pattern like `strokeDasharray="4 4"`. Remove the `strokeDashoffset` and `drawLine` animation so the line appears as a simple static dotted line (matching the memory style note).

3. **Connect the line to the badge** -- Change `lineStart` from `chartLeft + badgeWidth + 4` (which leaves a gap) to `chartLeft + badgeWidth` (or even `chartLeft + badgeWidth - 2` for a slight overlap) so the dotted line visually connects to the right edge of the glass badge without a gap.

## Technical Details

### File: `src/components/dashboard/sales/ForecastingCard.tsx`

**Daily average section (lines 666-693):** Remove the halo `<line>` (lines 671-679), simplify the visible line to use `strokeDasharray="4 4"` with no animation, and adjust `lineStart` to remove the gap.

**Weekly average section (lines 726-753):** Same changes -- remove halo line (lines 731-739), simplify to dotted, adjust `lineStart`.

**Before (both sections):**
```tsx
const lineStart = chartLeft + badgeWidth + 4;
// halo line with strokeWidth={5}
// animated solid line with strokeDashoffset trick
```

**After (both sections):**
```tsx
const lineStart = chartLeft + badgeWidth;
// Single dotted line, no halo, no animation
<line
  x1={lineStart} y1={yPos} x2={chartRight} y2={yPos}
  stroke="hsl(var(--foreground) / 0.35)"
  strokeDasharray="4 4"
  strokeWidth={1.5}
/>
```

The line color uses the theme-aware `hsl(var(--foreground) / 0.35)` per the existing style conventions for reference lines.

### Files to edit
- `src/components/dashboard/sales/ForecastingCard.tsx`
