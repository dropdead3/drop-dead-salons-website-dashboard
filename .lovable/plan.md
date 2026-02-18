

## Add Color Key and UI Enhancements to Price Realization Chart

### Problem

The Price Realization bar chart uses three distinct colors (gray, green, and dark/primary) but has no legend explaining what each color represents. Users must guess what "Menu Price" vs "Avg Collected" bars mean and what the color coding (green = premium, red = discounting, neutral = on-target) signifies.

### Changes

**File: `src/components/dashboard/analytics/ServicesContent.tsx`**

1. **Add a color key legend** between the chart and the drill-down grid (after the chart `</div>` closing around line 809, before the grid `<div>` at line 810). The legend will be a compact horizontal row showing:
   - Gray dot + "Menu Price" label
   - Green dot + "Collecting Above (>105%)" label
   - Primary/dark dot + "On Target (85-105%)" label  
   - Red dot + "Below Menu (<85%)" label

   Styled as a subtle divider line followed by `flex flex-wrap items-center gap-x-4 gap-y-1.5` with `text-xs text-muted-foreground`, matching the existing `ServiceMixLegend` pattern.

2. **Add a summary insight line** above the legend showing overall realization health -- e.g., count of services collecting above vs below menu price. This gives an at-a-glance takeaway before users drill into individual rows.

3. **Subtle gradient divider** (matching the existing `h-px bg-gradient-to-r from-transparent via-border/40 to-transparent` pattern) between the chart and the legend section for visual separation.

### Technical Details

- Color key dots use inline `style={{ backgroundColor }}` matching the exact bar fill values already in the code:
  - Menu Price: `hsl(var(--muted-foreground) / 0.3)`
  - Above 105%: `hsl(142 76% 36%)`
  - On Target: `hsl(var(--primary))`
  - Below 85%: `hsl(0 84% 60%)`
- Summary counts are derived from the existing `priceRealizationData` array (already computed in useMemo) by filtering on `entry.rate` thresholds
- No new components needed -- all markup is inline within the existing `<>` fragment, following the same pattern as `ServiceMixLegend`
- No new dependencies or data fetching required

### Visual Result

```text
[========= BAR CHART =========]

────────────────────────────────
  ● Menu Price   ● Above Menu   ● On Target   ● Below Menu
  3 services collecting above  |  1 below menu price

[====== DRILL-DOWN GRID ======]
```

