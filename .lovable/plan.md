

# Enterprise Location Comparison -- Redesign

## Overview
Replace the current 2-card side-by-side `LocationComparison` component with a scalable, tiered system that adapts its layout and density based on how many locations the organization has. Three distinct visual tiers ensure the UI stays clean whether you have 2 locations or 50.

---

## Tier System

### Tier 1: Small (2-5 locations) -- "Head-to-Head Cards"
- Full detail cards in a responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- Each card shows: revenue, share-of-total progress bar, services count, products count, avg ticket, and a period-over-period trend badge
- Leader card gets a subtle accent border; lowest performer gets a gentle "opportunity" flag
- Click a card to expand an inline drill-down panel (service/product split, top 3 stylists at that location, hourly peak)

### Tier 2: Medium (6-20 locations) -- "Ranked Table with Expandable Rows"
- Compact sortable table with columns: Rank, Location, Revenue, Services, Products, Avg Ticket, Share %, Trend
- Default sort: revenue descending
- Each row is expandable (framer-motion) to reveal a detail panel identical to the Tier 1 drill-down
- Sticky header; capped at 10 visible rows with "Show all N locations" toggle
- A mini stacked bar at the top shows revenue distribution across all locations (thin, single-row, color-coded)

### Tier 3: Large (20+ locations) -- "Scoreboard + Search"
- Same ranked table as Tier 2 but with:
  - A search/filter input to find locations by name
  - Region grouping dropdown (by state/city)
  - Pagination or virtualized scroll for 50+ locations
  - Bulk "Expand All / Collapse All" controls

### Shared Elements (all tiers)
- Header with MapPin icon, "LOCATION COMPARISON" title, AnalyticsFilterBadge, and total revenue Badge (variant="secondary")
- Sort controls: dropdown to pick metric (Revenue, Avg Ticket, Services, Products, Trend) + direction toggle
- "View mode" toggle (Cards vs Table) available in Tier 1-2 range so users can switch

---

## Drill-Down Panel (per location)
When a location card or table row is expanded, show:
1. **Revenue Breakdown** -- service vs product split (horizontal stacked bar)
2. **Top 3 Stylists** -- avatar, name, revenue at that location
3. **Peak Hour** -- single stat from capacity data
4. **Period Comparison** -- delta vs previous period (arrow + percentage)

Uses `framer-motion` AnimatePresence for smooth expand/collapse.

---

## Technical Plan

### Files to create
1. **`src/components/dashboard/sales/location-comparison/LocationComparisonCard.tsx`** -- Single location detail card (Tier 1 unit)
2. **`src/components/dashboard/sales/location-comparison/LocationComparisonTable.tsx`** -- Sortable table with expandable rows (Tier 2/3)
3. **`src/components/dashboard/sales/location-comparison/LocationDrilldownPanel.tsx`** -- Shared drill-down content
4. **`src/components/dashboard/sales/location-comparison/LocationRevenueBar.tsx`** -- Thin stacked revenue distribution bar
5. **`src/components/dashboard/sales/location-comparison/index.tsx`** -- Re-export barrel

### Files to modify
1. **`src/components/dashboard/sales/LocationComparison.tsx`** -- Refactor to act as the tier-routing wrapper:
   - Count locations, select Tier 1/2/3 layout
   - Pass shared sort state, expand state, and drill-down handlers
   - Keep existing `LocationData` interface and props contract so `SalesTabContent` and `SalesDashboard` imports remain unchanged

### Data flow
- Existing `locationData` prop provides revenue, services, products, transactions per location
- Drill-down panel will call `useServiceProductDrilldown` filtered to the specific `locationId`
- Period comparison uses `useSalesComparison` scoped to the single location
- Peak hour uses `useCapacityReport` scoped to the single location
- All queries are lazy-loaded (only fetched when the drill-down panel opens)

### Tier detection logic
```text
locations.length <= 5   -->  Tier 1 (Cards)
locations.length <= 20  -->  Tier 2 (Table)
locations.length > 20   -->  Tier 3 (Scoreboard + Search)
```

Users can override via the Cards/Table view toggle in Tiers 1-2.

### Sorting
- Shared `useState` for `sortKey` (revenue | avgTicket | services | products | trend) and `sortDirection`
- Applied to all tiers uniformly via a `useMemo` sorted array

### Animations
- `framer-motion` `AnimatePresence` + `motion.div` for drill-down expand/collapse
- Consistent with existing patterns (e.g., `CategoryBreakdownPanel`)

### Capping and expansion
- Tier 2: default shows top 10, "Show all N" toggle
- Tier 3: default shows top 10, search filters full list, ScrollArea for overflow
- Follows existing `ui/list-capping-and-expansion-standards` memory

### Privacy
- All monetary values wrapped in `BlurredAmount` from `HideNumbersContext`

