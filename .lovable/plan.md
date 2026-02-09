
# Fix Reference Line Z-Order, Add Scroll-Triggered Animations

## Issues to Fix

1. **Green peak bar hides the orange reference line** -- The `<Customized>` renders in SVG paint order but bars still cover it because Recharts renders `<Customized>` within the same layer. We need to move the reference line group to render with a higher SVG z-index by wrapping it in a `<g>` with explicit positioning outside the bar layer, or by using CSS `isolation` on the bars.

2. **Animations play immediately on mount** -- They should only trigger when the chart section scrolls into view.

3. **Bars should animate in** -- Add a grow-up animation to bars.

## Technical Changes

### Both `WeekAheadForecast.tsx` and `ForecastingCard.tsx`:

**1. Fix line rendering above bars**

Add `style={{ isolation: 'isolate' }}` won't work in SVG. Instead, the fix is to use Recharts' rendering order -- `<Customized>` placed after `<Bar>` should render on top. The real issue is the `fillOpacity` on the green bar being `1` (fully opaque). Since we can't change SVG z-order easily within Recharts, we'll add a second `<Customized>` component that re-renders the line with a white/background stroke underneath (a "halo" effect) to ensure visibility, OR we render the line with `strokeOpacity` and a thicker background stroke. The cleanest approach: render a slightly thicker background stroke in the `--background` color first, then the orange dashed line on top. This guarantees visibility regardless of bar overlap.

Actually, the simplest fix: the `<Customized>` IS already after the bars. The issue from the screenshot is that the line passes through the peak bar at its midpoint where the bar is tall. The line simply needs to render ON TOP. We'll move the entire reference line `<g>` to use a `<defs>` + `<use>` pattern, or more practically, we'll apply a semi-transparent background "halo" stroke behind the dashed line to make it pop.

Best approach: Add a solid background-colored stroke underneath the dashed line (same coordinates, slightly thicker, `stroke: hsl(var(--background))`) to create a knockout effect that makes the line always visible.

**2. Scroll-triggered animations using IntersectionObserver**

Wrap the chart container `<div>` with a ref and use `IntersectionObserver` (or framer-motion's `useInView`) to detect when the section is fully in view. Pass an `isVisible` boolean into the chart. The CSS animations will only apply when `isVisible` is true.

- Use `useInView` from framer-motion (already imported) with `{ once: true, amount: 0.8 }` 
- When `isVisible` becomes true, set a state that triggers the CSS animations
- The `@keyframes` animations will use `animation-play-state: paused/running` controlled by this state

**3. Bar grow animation**

Use Recharts' `<Bar isAnimationActive animationDuration={800} animationBegin={0} />` props combined with the scroll visibility trigger. When the chart first becomes visible, we mount it (or toggle `isAnimationActive`). Since Recharts bars animate on first render by default, the simplest approach is to conditionally render the chart only when `isVisible` is true, so bars animate as the section scrolls into view.

### Implementation Steps

1. Add `useInView` ref to the chart container div in both files
2. Conditionally render the `<ResponsiveContainer>` only when `inView` is true (this triggers Recharts' built-in bar grow animation on scroll)
3. For the reference line animation, add a delay (e.g., `animationDelay: '0.6s'`) so it starts after bars finish growing
4. Add a background "halo" stroke behind the dashed line for guaranteed visibility over bars:
   ```tsx
   {/* Background halo for visibility */}
   <line x1={...} y1={yPos} x2={...} y2={yPos}
     stroke="hsl(var(--background))"
     strokeWidth={5}
   />
   {/* Actual dashed line */}
   <line x1={...} y1={yPos} x2={...} y2={yPos}
     stroke="hsl(25, 100%, 55%)"
     strokeDasharray={lineLength}
     strokeDashoffset={lineLength}
     strokeWidth={1.5}
     style={{ animation: '...' }}
   />
   ```
5. Set bar animation props: `animationDuration={800}` and `animationEasing="ease-out"`

### Files to edit
- `src/components/dashboard/sales/WeekAheadForecast.tsx`
- `src/components/dashboard/sales/ForecastingCard.tsx`
