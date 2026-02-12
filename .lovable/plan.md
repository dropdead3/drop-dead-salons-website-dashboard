

# Refined Location Revenue Share Bar

## What Changes

The divided bar needs three refinements to match the premium aesthetic shown in the screenshot:

1. **Text color**: Use dark text (`foreground`) on all segments instead of white/inverted text. The oat and green segments both have enough lightness to support dark labels.

2. **Segment colors**: Use the theme-aware `chart-*` variables directly (which already map to oat-toned and emerald values per theme), but ensure the foreground text is always dark for readability -- matching the screenshot exactly.

3. **Bar polish**: Slightly increase rounding and ensure the glass sheen is subtle, not heavy. The screenshot shows a clean, flat-ish bar with just enough dimension.

## Technical Details

### File: `src/components/dashboard/sales/LocationComparison.tsx`

**Changes to the bar segment rendering (lines ~207-246):**

- Remove the conditional `color` style that switches between `background` and `muted-foreground` for text. Instead, always use a dark foreground color: `hsl(var(--foreground))` for all segments.
- Reduce the glass sheen opacity from `0.15` to `0.08` for a more subtle, premium feel.
- Keep `rounded-full` and `h-10` as-is (these match the screenshot).
- Show the percentage label when the segment is at least 12% wide (lowered from 15%) to display more labels when possible.

That is the only file changed. The colors themselves (`chart-1`, `chart-2`, etc.) are already correctly themed per the CSS variables -- the issue is purely the text contrast and sheen intensity.

