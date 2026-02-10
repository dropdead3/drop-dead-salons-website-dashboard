
# Liquid Glass Stroke on Birthday Banner

## What Changes
Add a reflective, liquid-glass border effect to the birthday banner that picks up the pink-purple gradient colors, creating a glossy, translucent stroke with a sheen highlight.

## How It Works
The effect is achieved using a wrapper `div` with a matching gradient background acting as the visible "stroke," and the inner banner content sitting on top with a slight inset (via padding on the wrapper). A secondary pseudo-element overlay adds a diagonal white sheen/reflection across the top for the liquid glass look.

## Technical Details

### File: `src/components/dashboard/TodaysBirthdayBanner.tsx`

1. **Wrap the banner** in a container `div` that provides the gradient stroke:
   - Background: a pink-to-purple gradient matching the banner but slightly lighter/more saturated
   - `rounded-xl` with `p-[2px]` to create a thin gradient border effect
   - Add a subtle outer glow via `shadow-[0_0_15px_rgba(168,85,247,0.4)]`

2. **Add a sheen overlay** using an `::after` pseudo-element (via inline style or an absolutely-positioned child div):
   - A diagonal `linear-gradient` from `white/30%` to `transparent` positioned across the top-left
   - `pointer-events-none` so it doesn't block clicks
   - `mix-blend-mode: overlay` for that reflective glass look

3. **Adjust the inner banner div**:
   - Keep its existing gradient background
   - Add `rounded-[10px]` (slightly less than wrapper) so the stroke peeks through evenly
   - The `backdrop-blur` on the inner content enhances the glass feel

No new dependencies or files needed -- pure CSS layering with an extra wrapper div.
