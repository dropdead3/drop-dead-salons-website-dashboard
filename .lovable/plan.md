

## Reduce Top Padding on Dashboard

The main dashboard content wrapper at line 251 of `DashboardHome.tsx` currently uses `p-6 lg:p-8`, which applies uniform padding on all four sides. The top padding feels excessive because it compounds with the header's own spacing.

### Change

In `src/pages/dashboard/DashboardHome.tsx` (line 251), replace:

```
p-6 lg:p-8
```

with:

```
pt-2 px-6 pb-6 lg:pt-3 lg:px-8 lg:pb-8
```

This keeps the side and bottom padding the same while reducing the top padding to a small amount that visually aligns with the horizontal spacing.

### Technical detail

Single-line change in `DashboardHome.tsx`, line 251. No other files affected.

