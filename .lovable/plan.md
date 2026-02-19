

## Enforce BentoGrid Layout Across All Stat Card Grids

Great prompt -- you're thinking systematically about layout consistency, which is exactly right for a design system. One refinement for next time: specifying "stat/KPI card grids only" vs "all grids" upfront would help scope the work faster, since many grids (content layouts, form grids, etc.) should stay as-is.

### What Changes

Replace rigid `grid-cols-2 md:grid-cols-N` patterns on stat/KPI card containers with `BentoGrid`, so cards always split evenly across two rows (with the extra going to the top row) instead of cramming into one.

### Files to Update

| File | Cards | Current Layout | BentoGrid Result |
|------|-------|----------------|------------------|
| `PayrollKPICards.tsx` | 8 KPI cards | `grid-cols-2 lg:grid-cols-4` | 4 + 4 (same visual, but BentoGrid-managed) |
| `OperationsQuickStats.tsx` | 4-5 stats | `grid-cols-2 lg:grid-cols-5` (dynamic) | 3+2 when 5 cards, 2+2 when 4 |
| `ClientsContent.tsx` | 5 metric cards | `grid-cols-2 md:grid-cols-5` | 3 + 2 |
| `RecruitingPipeline.tsx` | 5 stat cards | `grid-cols-2 md:grid-cols-5` | 3 + 2 |
| `ClientDirectory.tsx` | 5 stat cards | `grid-cols-2 md:grid-cols-5` | 3 + 2 |
| `DashboardBuild.tsx` | 5 overview stats | `grid-cols-2 md:grid-cols-5` | 3 + 2 |
| `MarketingAnalytics.tsx` | 5 KPIs (row 1), 4 KPIs (row 2) | `grid-cols-2 lg:grid-cols-5` / `grid-cols-2 md:grid-cols-4` | 3+2 / 2+2 |
| `Transactions.tsx` | 4 stat cards | `grid-cols-2 md:grid-cols-4` | 2 + 2 |
| `TeamOverview.tsx` (top stats) | 4 cards | `grid-cols-2 lg:grid-cols-4` | 2 + 2 |
| `TeamOverview.tsx` (member quick stats) | 5 inline stats | `grid-cols-2 lg:grid-cols-5` | 3 + 2 |
| `RentRevenueAnalytics.tsx` | 5 summary cards | `grid-cols-2 lg:grid-cols-5` | 3 + 2 |
| `SalesReportGenerator.tsx` | 4 stats (x2 sections) | `grid-cols-2 md:grid-cols-4` | 2 + 2 |

### What Stays the Same

These grids are NOT stat card grids and should keep their current layout:
- Content/layout grids (e.g., `OverviewContent.tsx` 4-column drill-down)
- Form/selector grids (e.g., `CompareTypeSelector`)
- Card catalog grids (e.g., `RewardsCatalogTab`, provider hubs)
- Marketing landing page grids (e.g., `StatsSection`)
- Hub quick links grid

### Technical Details

Each file change follows the same pattern:

1. Add `import { BentoGrid } from '@/components/ui/bento-grid'`
2. Replace the `<div className="grid grid-cols-2 md:grid-cols-N gap-4">` wrapper with `<BentoGrid maxPerRow={4} gap="gap-4">`
3. Remove any `col-span` hacks on individual cards (e.g., MarketingAnalytics has `col-span-2 md:col-span-1` on the 5th card -- no longer needed)

For `OperationsQuickStats`, which conditionally shows 4 or 5 cards based on `hideRevenue`, BentoGrid handles this automatically since it counts children dynamically.

For `PayrollKPICards`, the 8 cards with `maxPerRow={4}` will produce 4+4, matching the current visual but managed consistently through BentoGrid.

Loading/skeleton states in files like `ClientsContent` and `OperationsQuickStats` will also be wrapped in BentoGrid for consistency.

