

# Brighten Internal Bento Sub-Card Backgrounds in Dark Mode

## Problem
Internal sections (New Clients, Returning Clients, After-Service Rebook, location rows, KPI cells, 30-day comparison) have `bg-muted/20` or `bg-muted/30 dark:bg-card` backgrounds that are nearly invisible against the parent card in dark mode. The `--muted` value (15% lightness) at low opacity on a 7% card background produces almost no contrast.

## Approach
Increase the dark-mode `--muted` lightness from 15% to 20% across all four dark themes. This brightens every internal sub-card that uses `bg-muted/*` without touching any component files. It is the single most impactful change because dozens of elements across the dashboard reference `bg-muted/20` and `bg-muted/30`.

## File: `src/index.css`

| Dark Theme | CSS Variable | Current Value | New Value |
|---|---|---|---|
| Cream | `--muted` | `0 0% 15%` | `0 0% 20%` |
| Rose | `--muted` | `350 10% 15%` | `350 10% 20%` |
| Sage | `--muted` | `145 8% 15%` | `145 8% 20%` |
| Ocean | `--muted` | `210 10% 15%` | `210 10% 20%` |

This 5% lightness bump means `bg-muted/30` renders at ~20% lightness instead of ~15%, creating a clearly visible fill difference against the 7% card background. All internal sub-cards, location rows, KPI cells, and secondary sections will immediately gain contrast without any per-component edits.

Total: 4 CSS variable changes in 1 file.

