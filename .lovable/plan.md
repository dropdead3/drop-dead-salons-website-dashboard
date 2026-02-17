

## Add "By Category / Solid" Bar Display Toggle with Persistence

### What Changes

A small toggle will be added to the forecast chart header area, allowing users to switch between two bar display modes:

1. **By Category** (current default): Stacked bars colored by service category (Haircuts, Color, etc.)
2. **Solid**: A single solid-color bar per day showing total revenue only (using the primary brand color)

The user's selection persists across sessions via the existing `dashboard_layout` JSON in `user_preferences`.

### UI Design

- A small segmented toggle (using the existing `FilterTabsList` / `FilterTabsTrigger` pattern) placed near the location selector in the card header
- Two options: "By Category" and "Solid"
- Compact, matches the existing filter tab aesthetic (the same tokens just updated for light mode visibility)

### Technical Details

**1. New Hook: `src/hooks/useForecastChartMode.ts`**

A lightweight hook that:
- Reads the current mode from `dashboard_layout.forecastChartMode` in `user_preferences` (defaults to `'category'`)
- Provides a `setMode` function that updates the JSONB field
- Uses the same read/write pattern as `useDashboardLayout` (check existing row, update or insert)
- Query key: `['user-preferences']` to stay in sync with other dashboard prefs

```
type ForecastChartMode = 'category' | 'solid';
```

**2. Update: `src/components/dashboard/sales/WeekAheadForecast.tsx`**

- Import the new hook and `FilterTabsList` / `FilterTabsTrigger`
- Add the toggle in the header area (next to location select and bookings badge)
- When mode is `'solid'`:
  - Render a single `<Bar dataKey="totalRevenue">` with `fill="hsl(var(--primary))"` instead of the category-stacked bars
  - Tooltip shows just total revenue (no category breakdown)
- When mode is `'category'`:
  - Keep existing stacked category bars (current behavior)

**3. Update: `src/components/dashboard/sales/ForecastingCard.tsx`**

- Same toggle and logic as WeekAheadForecast
- Same conditional rendering: single bar for solid mode, stacked bars for category mode

### Data Flow

```text
user_preferences.dashboard_layout (JSONB)
  └── forecastChartMode: 'category' | 'solid'
         │
         ▼
  useForecastChartMode() hook
         │
         ├── WeekAheadForecast.tsx  →  toggle + conditional bar rendering
         └── ForecastingCard.tsx    →  toggle + conditional bar rendering
```

### Files

| File | Action |
|------|--------|
| `src/hooks/useForecastChartMode.ts` | New -- read/write preference |
| `src/components/dashboard/sales/WeekAheadForecast.tsx` | Add toggle + conditional rendering |
| `src/components/dashboard/sales/ForecastingCard.tsx` | Add toggle + conditional rendering |

### No Database Migration Needed

The `dashboard_layout` column is already a JSONB field. Adding a new key (`forecastChartMode`) requires no schema changes.

