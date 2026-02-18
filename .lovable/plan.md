

## Remove Moon Icons from X-Axis Ticks, Bold "Closed" Text

### What Changes

In the x-axis tick labels across all four chart files, the inline SVG moon path will be removed. The "Closed" text will be restyled to match the appointment count line: `text-[11px]` with `fontWeight: 500` and `fill-foreground` (dark text, not muted). The moon icons in the bar overlay area (via `<Customized>`) remain untouched.

### Files and Edits

**1. `src/components/dashboard/sales/CapacityUtilizationCard.tsx` (lines 88-95)**
- Remove the `<g>` with the moon SVG path (lines 88-92)
- Change the "Closed" text from `fill-muted-foreground text-[9px]` to `fill-foreground text-[11px]` with `fontWeight: 500`
- Remove the x-offset (change `x={4}` to `x={0}`) since the moon icon no longer pushes the text right

**2. `src/components/dashboard/analytics/CapacityUtilizationSection.tsx` (lines 89-95)**
- Same changes as above

**3. `src/components/dashboard/sales/WeekAheadForecast.tsx`**
- Two occurrences:
  - Lines 114-123: "has appointments + is closed" case — remove moon path, bold "Closed"
  - Lines 127-136: "no appointments + is closed" case — remove moon path, bold "Closed"

**4. `src/components/dashboard/sales/ForecastingCard.tsx`**
- Two occurrences:
  - Lines 265-276: "has appointments + is closed" case — remove moon path, bold "Closed"
  - Lines 279-288: "no appointments + is closed" case — remove moon path, bold "Closed"

### Before / After

```text
Before:  <moon-svg> + <text class="fill-muted-foreground text-[9px]">Closed</text>
After:   <text class="fill-foreground text-[11px]" fontWeight={500}>Closed</text>
```

No changes to the `<Customized>` bar-area moon overlays in any file.

