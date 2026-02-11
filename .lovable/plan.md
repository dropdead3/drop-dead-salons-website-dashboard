

# Enhance Dark Mode Border Brightness

## What Changes
A small increase in the `--border` and `--sidebar-border` lightness values across all four dark theme variants in `src/index.css`, making card strokes slightly more visible for better definition.

## File: `src/index.css`

| Dark Theme | Current `--border` | New `--border` | Current `--sidebar-border` | New `--sidebar-border` |
|---|---|---|---|---|
| `.dark.theme-cream` | `0 0% 18%` | `0 0% 22%` | `0 0% 18%` | `0 0% 22%` |
| `.dark.theme-rose` | `350 10% 20%` | `350 10% 24%` | `350 10% 20%` | `350 10% 24%` |
| `.dark.theme-sage` | `145 8% 20%` | `145 8% 24%` | `145 8% 20%` | `145 8% 24%` |
| `.dark.theme-ocean` | `210 10% 20%` | `210 10% 24%` | `210 10% 20%` | `210 10% 24%` |

This is a ~4% lightness bump -- enough to add visible structure without creating the harsh white-stroke issue from before.

