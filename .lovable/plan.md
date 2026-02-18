

## Soften Forecasting Bars to Warm Tan/Gray in Light Mode

### What's Changing

The "Solid" mode bars currently use `hsl(var(--primary))` which renders as near-black in light mode. They'll be updated to a warm tan/gray tone that feels lighter and more refined, while preserving the dark mode appearance.

### Visual Effect

```text
Before:  Dark black/charcoal gradient bars (--primary based)
After:   Warm tan/stone gradient -- e.g. hsl(35, 12%, 72%) fading to hsl(35, 10%, 85%)
         Still with glass stroke for depth
         Dark mode unchanged (keeps --primary)
```

### Technical Details

**Files to modify:**

| File | Change |
|------|--------|
| `src/components/dashboard/sales/WeekAheadForecast.tsx` (lines 461-463) | Update `solid-glass-week` gradient stops to use a warm neutral tone with CSS color-mix or a light-mode-specific warm gray |
| `src/components/dashboard/sales/ForecastingCard.tsx` (lines 831-833) | Same update for `solid-glass-forecast` gradient |

**Approach:**

Use two sets of gradient stops -- a warm stone color for light mode and the existing primary for dark mode. Since SVG `<defs>` don't support Tailwind dark-mode classes, the cleanest approach is to use CSS custom properties that already shift between modes.

The gradient stops will change from:
- `stopColor="hsl(var(--primary))"` with 0.85/0.45 opacity

To a warm neutral using the muted-foreground variable at reduced opacity, which naturally shifts between modes:
- Top stop: `stopColor="hsl(var(--muted-foreground))"` at `0.45` opacity
- Bottom stop: `stopColor="hsl(var(--muted-foreground))"` at `0.18` opacity

This produces a soft warm gray/tan in light mode (since `--muted-foreground` is a warm neutral in the theme) and stays appropriately toned in dark mode. The glass stroke (`--foreground / 0.12`) remains unchanged.

Both files receive identical gradient updates to keep the two forecasting charts visually consistent.

