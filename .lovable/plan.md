

## Combine Service Popularity + Category Popularity into One Toggleable Card

The two separate cards ("Service Popularity" and "Category Popularity") will be merged into a single card with a view-level toggle at the top, keeping the existing "By Revenue / By Frequency" sort toggle within each view.

---

### What Changes

**1. New combined component: `src/components/dashboard/sales/ServicePopularityChart.tsx`**

- Add a top-level toggle ("By Service" / "By Category") above the existing Revenue/Frequency tabs
- When "By Service" is selected, render the current ServicePopularityChart content (bar chart + ServiceMixLegend + Stylist Breakdown drill-down)
- When "By Category" is selected, render the current CategoryPopularityChart content (bar chart + Category Drill-Down with stylist/client breakdown)
- Card header updates:
  - Title stays "SERVICE POPULARITY" (covers both views)
  - Description adapts: "Top services ranked by demand" vs "Service categories ranked by dominance"
  - Badges adapt: show service count or category count accordingly
  - Icon stays Scissors
- The top toggle will use `FilterTabsList` / `FilterTabsTrigger` with a different visual grouping (e.g., placed in the card header area) to distinguish it from the Revenue/Frequency sort toggle below

**2. Update `ServicesContent.tsx`**

- Remove the separate `category_popularity` section from the sections record
- Remove `category_popularity` from `SERVICES_SECTION_DEFS` and `SERVICES_DEFAULT_ORDER`
- The `service_popularity` section now renders the combined component (which handles both views internally)
- Remove the `CategoryPopularityChart` import

**3. Delete `src/components/dashboard/sales/CategoryPopularityChart.tsx`**

- All its logic (the AnimatedBar, category drill-down rows, stylist breakdown per category) will be inlined into the combined `ServicePopularityChart.tsx`

---

### UI Layout (Top to Bottom)

```text
+--------------------------------------------------+
| [icon] SERVICE POPULARITY  (i)                   |
| [filter badges] [139 services | $15,553]         |
| "Top services ranked by demand and revenue"       |
|                                                   |
| [ By Service ]  [ By Category ]    <-- view toggle|
|                                                   |
| [ $ By Revenue ]  [ ~ By Frequency ] <-- sort    |
|                                                   |
| [========= Bar Chart =========]                   |
|                                                   |
| Service Mix legend (service view only)            |
| STYLIST BREAKDOWN / CATEGORY DRILL-DOWN           |
+--------------------------------------------------+
```

---

### Technical Details

- The view toggle state (`'service' | 'category'`) is local component state, defaulting to `'service'`
- Each view maintains its own independent sort state (`'revenue' | 'frequency'`)
- The CategoryPopularityChart's `useRevenueByCategoryDrilldown` hook will be imported directly into the combined component
- The AnimatedBar component from CategoryPopularityChart is nearly identical to ServicePopularityChart's version -- consolidate into one shared implementation
- Badge counts switch between total services count and category count based on view
- The `PinnableCard` wrapper in ServicesContent stays as-is, just wrapping the combined component under the `service_popularity` key
- Users who had `category_popularity` in their saved card order will gracefully fall back since missing IDs are simply skipped by the reorder system

### Files Modified
- `src/components/dashboard/sales/ServicePopularityChart.tsx` -- major refactor to include category view
- `src/components/dashboard/analytics/ServicesContent.tsx` -- remove category_popularity section and import
- `src/components/dashboard/sales/CategoryPopularityChart.tsx` -- deleted (logic merged)
