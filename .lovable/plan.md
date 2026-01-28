
# Fix Forecasting Card Bar Colors in Dark/Light Mode

## Problem

The first bar in the forecasting chart appears **black in dark mode** instead of the expected color. This happens because:

1. The peak bar uses `hsl(var(--chart-2))` for its fill color
2. **`--chart-2` is NOT defined** in the CSS variables
3. When a CSS variable is undefined, `hsl(var(--chart-2))` becomes invalid, causing the browser to render a default color (often black)

The session replay confirms: "The first sector is filled with `hsl(var(--primary))`" but actually for peak bars it's using `--chart-2` which doesn't exist.

## Solution

Add the missing chart color CSS variables (`--chart-1` through `--chart-5`) to the theme definitions in `src/index.css`. This will provide proper colors for data visualization in both light and dark modes.

## Technical Details

### 1. Add Chart Color Variables to index.css

**Light Mode (`:root, .theme-cream`)** - add after line 131 (after `--success`):
```css
/* Chart colors for data visualization */
--chart-1: 0 0% 25%;           /* Dark charcoal for primary bars */
--chart-2: 145 60% 40%;         /* Green for peak/success highlights */
--chart-3: 217 91% 60%;         /* Blue */
--chart-4: 43 96% 50%;          /* Amber/Gold */
--chart-5: 280 87% 55%;         /* Purple */
```

**Dark Mode (`.dark.theme-cream`)** - add after line 213 (after `--success-foreground`):
```css
/* Chart colors for data visualization */
--chart-1: 40 25% 75%;          /* Warm tan - visible on dark background */
--chart-2: 145 55% 55%;          /* Bright green for peak/success */
--chart-3: 217 85% 65%;          /* Bright blue */
--chart-4: 43 95% 60%;           /* Bright amber */
--chart-5: 280 75% 70%;          /* Bright purple */
```

### 2. Update Other Themes (Rose, Sage, Ocean)

Add corresponding `--chart-1` through `--chart-5` variables to each theme's light and dark mode definitions for consistency.

## Files to Modify

| File | Change |
|------|--------|
| `src/index.css` | Add `--chart-1` through `--chart-5` to all theme definitions (Cream, Rose, Sage, Ocean - both light and dark modes) |

## Expected Result

After this fix:
- **Light mode**: Bars will be dark charcoal (`--chart-1`), peak bars bright green (`--chart-2`)
- **Dark mode**: Bars will be warm tan (`--chart-1`), peak bars bright green (`--chart-2`)
- All chart colors will have proper contrast against their respective backgrounds
- No more black bars due to undefined CSS variables
