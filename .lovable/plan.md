

# Fix Visible Card Borders in Dark Mode

## Root Cause

In `src/index.css`, the `.dark.theme-cream` selector sets:
- `--background: 0 0% 4%` (almost black)
- `--card: 0 0% 7%` (very dark gray)
- `--border: 0 0% 18%` (medium-dark gray)

The gap between card (7% lightness) and border (18% lightness) is too large, making borders appear as prominent light strokes. The same issue exists in the other dark theme variants (rose, sage, ocean).

## The Fix

Reduce `--border` lightness in all dark theme variants from ~18-20% down to ~12-13%, making borders much more subtle. Also reduce `--sidebar-border` to match.

### File: `src/index.css`

| Dark Theme Variant | Current `--border` | New `--border` |
|---|---|---|
| `.dark.theme-cream` | `0 0% 18%` | `0 0% 12%` |
| `.dark.theme-rose` | `350 10% 20%` | `350 10% 14%` |
| `.dark.theme-sage` | `145 8% 20%` | `145 8% 14%` |
| `.dark.theme-ocean` | `210 10% 20%` | `210 10% 14%` |

Same reduction applied to `--sidebar-border` values in each variant.

This makes card borders barely visible in dark mode (a subtle definition line rather than a prominent stroke), matching the premium luxury aesthetic.

| File | Change |
|---|---|
| `src/index.css` | Lower `--border` and `--sidebar-border` lightness values in all 4 dark theme blocks |

