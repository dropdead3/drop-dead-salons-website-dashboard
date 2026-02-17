

## Stacked Category-Colored Forecast Bars

### What Changes

Each bar in the Revenue Forecast charts (both ForecastingCard and WeekAheadForecast) will become a stacked bar where each segment represents a service category, colored using the admin-configured service category colors from Settings.

Instead of the current confirmed/unconfirmed split, the bar will show: "How much of today's revenue is Color, Cut, Texture, etc." -- proportionally, using the exact colors configured in service settings.

### Data Layer Changes

**`src/hooks/useForecastRevenue.ts`**
- Add a `byCategory` field to `DayForecast` interface: `categoryBreakdown: Record<string, number>` (category name to revenue)
- During the per-appointment loop, also accumulate revenue by category per day
- For `WeekForecast`, aggregate the daily category breakdowns into weekly totals
- Keep the existing top-level `byCategory` intact (used by CategoryBreakdownPanel)

**`src/hooks/useWeekAheadRevenue.ts`**
- Same change: add `categoryBreakdown: Record<string, number>` to `DayForecast`
- Accumulate per-day category revenue during the existing appointment loop

### Chart Layer Changes

**Both `ForecastingCard.tsx` and `WeekAheadForecast.tsx`**

1. Import `useServiceCategoryColorsMap` hook
2. Compute a sorted list of all unique categories across all days/weeks in the chart data
3. For chart data, flatten each day's `categoryBreakdown` into individual keys (e.g., `{ "Color": 1200, "Cut": 800, "Texture": 400 }`)
4. Replace the two `<Bar>` components (confirmed/unconfirmed) with a dynamic set of `<Bar>` components -- one per category, all sharing `stackId="revenue"`
5. Each `<Bar>` gets its fill color from `colorMap[category.toLowerCase()]?.bg || '#888888'`
6. The topmost bar in the stack gets `radius={[4, 4, 0, 0]}` for rounded tops; all others get `[0,0,0,0]`
7. Only the topmost bar renders the `<LabelList>` with revenue labels above
8. Replace the glass gradient `<defs>` with per-category SVG gradients for the translucent luxury look (opacity 0.75 to 0.35, matching the existing glass aesthetic)
9. Click handlers remain on all bars, firing the same `handleBarClick`

### Tooltip Update

The custom `ForecastTooltip` will be updated to show the category breakdown:
- Each category listed with its color dot and revenue amount
- Sorted by revenue descending
- Total and appointment count preserved at bottom

### What Stays the Same

- Daily average reference line (amber badge + dashed line)
- Peak day/week highlighting and callouts
- X-axis tick labels (day names, dates, appointment counts)
- Stat cards and category breakdown panels
- DayProviderBreakdownPanel drill-down
- Bar click to expand provider breakdown
- Weekly chart aggregation logic

### Technical Details

- 2 hook files updated (add `categoryBreakdown` to per-day aggregation)
- 2 component files updated (replace static 2-bar stack with dynamic N-bar stack)
- `useServiceCategoryColorsMap` hook reused (already cached, no extra queries)
- Fallback color `#888888` for uncategorized services
- SVG gradient definitions generated dynamically per category (one gradient per unique category in view)
- The "Uncategorized" bucket catches any appointments without a `service_category` value
