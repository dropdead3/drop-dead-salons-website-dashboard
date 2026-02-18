

## Reorganize Cards Feature for Analytics Pages

### What This Adds
A "Reorganize Cards" button on every analytics subtab page that opens a drag-and-drop drawer, letting users reorder the card sections to match their preferred viewing order. The order persists per user, per analytics page.

### How It Works

1. A small "Reorganize" button (using the existing `Settings2` or `ArrowUpDown` icon pattern) appears in the header area of each analytics subtab (Services, Overview, Retail, Correlations, Staffing, Appointments, Clients, Booking Pipeline, Marketing, etc.)

2. Clicking it opens a `Sheet` (side drawer) -- matching the existing `DashboardCustomizeMenu` pattern -- showing all card sections as a draggable list with grip handles using `@dnd-kit/sortable` (already installed and used throughout the app)

3. Users drag cards into their preferred order. The order saves automatically to the `user_preferences.dashboard_layout` JSONB column under a new key: `analyticsCardOrder` (a map of `pageId -> cardId[]`)

4. Each analytics content component renders its sections in the user's saved order instead of hardcoded order

### Technical Details

**New Hook: `src/hooks/useAnalyticsCardOrder.ts`**
- Reads/writes `analyticsCardOrder` from `user_preferences.dashboard_layout` JSONB
- Provides: `getCardOrder(pageId)` returns ordered card IDs, `saveCardOrder(pageId, cardIds[])` persists new order
- Follows the exact same read/write pattern as `useDashboardLayout.ts` and `useSettingsLayout.ts` (check for existing row, upsert)
- Includes a `resetOrder(pageId)` function

**New Component: `src/components/dashboard/analytics/AnalyticsCardReorderDrawer.tsx`**
- Generic reusable drawer component that accepts a `pageId` and list of `{ id, label, icon }` card definitions
- Uses `Sheet` + `DndContext` + `SortableContext` + `verticalListSortingStrategy` (same as `DashboardCustomizeMenu`)
- Renders `SortableSectionItem` (or a simpler variant without the toggle switch -- just grip handle + icon + label)
- "Reset to Default" button at the bottom
- Auto-saves on every drag-end event

**Modified Content Components** (each gets the reorder button + ordered rendering):
- `ServicesContent.tsx` -- 9 card sections (KPI tiles, Category Mix, Category Popularity, Client Type, Service Popularity, Efficiency Matrix, Rebooking Rates, Price Realization, Demand Trends, Service Pairings)
- `SalesTabContent.tsx` overview subtab -- Sales Overview, Revenue Trend, Location Comparison, Product Categories
- `MarketingTabContent.tsx` -- KPI tiles, Campaign Performance, Source Breakdown, Medium Distribution
- `OperationsTabContent.tsx` subtabs -- delegates to child content components
- Other subtab content components (Retail, Correlations, Staffing, etc.) as applicable

**Implementation Pattern per Page:**
1. Define a `SECTION_DEFINITIONS` array with `id`, `label`, `icon` for each card
2. Map each card's JSX into a `Record<string, ReactNode>` keyed by section ID
3. Use `useAnalyticsCardOrder(pageId)` to get the ordered IDs
4. Render sections by iterating the ordered IDs and looking up the component map
5. Add the `AnalyticsCardReorderDrawer` trigger button in the page header

This approach keeps each content component's card JSX untouched -- only the rendering order changes. No database migration needed since `dashboard_layout` is already a JSONB column that accepts arbitrary keys.

### No Database Changes Required
The `user_preferences.dashboard_layout` JSONB column already exists and can store the new `analyticsCardOrder` key without any schema migration.

