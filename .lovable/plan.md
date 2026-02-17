

## Wire Service Mix Colors to Service Category Settings

### Problem
The Service Mix donut charts (on the Capacity Utilization card and the Analytics section) use hardcoded `PIE_COLORS` arrays based on generic CSS chart variables (`--chart-1`, `--chart-2`, etc.). These colors don't match the admin-configured service category colors visible in Services Settings. The same issue affects `ServiceMixChart`, `AvgTicketByStylistPanel`, and `RevenueByCategoryPanel` which use the static `CATEGORY_COLORS` map from `serviceCategorization.ts`.

### Solution
Replace all hardcoded color arrays and static `CATEGORY_COLORS` lookups with the `useServiceCategoryColors()` hook, which fetches the actual `color_hex` values from the `service_category_colors` table. Build a name-based lookup map so each category gets its configured color.

### Changes

**1. `src/components/dashboard/sales/CapacityUtilizationCard.tsx`**
- Import `useServiceCategoryColors` hook
- Remove `PIE_COLORS` constant
- Build a `colorMap` from the hook data (keyed by lowercase category name)
- Replace `PIE_COLORS[index % PIE_COLORS.length]` with `colorMap[item.category.toLowerCase()] || fallbackColor` in both the pie data construction (~line 176) and the legend dots (~line 415)

**2. `src/components/dashboard/analytics/CapacityUtilizationSection.tsx`**
- Same changes as above: import hook, remove `PIE_COLORS`, use color map for pie data (~line 187) and legend dots (~line 397)
- Since this is a presentational component that receives data as props, it will accept a `categoryColorMap` prop passed from its parent, or call the hook directly

**3. `src/components/dashboard/sales/ServiceMixChart.tsx`**
- Import `useServiceCategoryColors` hook
- Remove hardcoded `COLORS` array
- Use category name lookup for pie cell fills

**4. `src/components/dashboard/sales/AvgTicketByStylistPanel.tsx`**
- Replace `import { CATEGORY_COLORS }` with `useServiceCategoryColors` hook
- Look up `color_hex` by category name instead of using the static map

**5. `src/components/dashboard/sales/RevenueByCategoryPanel.tsx`**
- Same as above: replace `CATEGORY_COLORS` with dynamic lookup from the hook

**6. Shared helper (optional simplification)**
- The existing `useServiceCategoryColorsMap()` hook already returns a `colorMap` keyed by lowercase category name with `{ bg, text, abbr }`. All five files above can use this directly: `colorMap[category.toLowerCase()]?.bg || '#888888'`

### Fallback Strategy
When a category exists in appointment data but has no matching entry in `service_category_colors` (e.g., uncategorized or "Other"), use `#888888` as the fallback -- a neutral gray that won't be confused with any configured color.

### What Does NOT Change
- The `service_category_colors` table and its CRUD operations
- The Services Settings UI
- Data fetching logic for service mix metrics
- Chart structure, animations, or layout

### File Count
- 5 component files updated (color source replacement)
- 0 new files
- No new dependencies

