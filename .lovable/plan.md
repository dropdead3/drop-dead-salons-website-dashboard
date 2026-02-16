

## Fix Executive Summary Card Grid Layout

### Problem
The KPI tiles don't span the full width cleanly:
- **Revenue and Liability** has 3 cards in a `md:grid-cols-4` grid, leaving a gap
- **Operations** has 4 cards in a `md:grid-cols-3` grid, causing the 4th card to wrap alone at partial width

### Solution
Add a simple helper that picks the right grid column count based on the number of items, ensuring even rows that span the full width.

**Grid logic:**
| Count | Grid Columns | Result |
|-------|-------------|--------|
| 1     | 1 col       | Full width |
| 2     | 2 cols      | 2 equal |
| 3     | 3 cols      | 3 equal |
| 4     | 2 or 4 cols | 2x2 on mobile, 4 across on desktop |
| 5     | 3 cols top + 2 cols bottom (or 5 cols) | Handled gracefully |
| 6     | 3 cols      | 2 clean rows of 3 |

### Changes

**File: `src/components/dashboard/analytics/ExecutiveSummaryCard.tsx`**

1. Create a small helper function that returns the appropriate grid class based on item count:
   - 1 item: `grid-cols-1`
   - 2 items: `grid-cols-2`
   - 3 items: `grid-cols-1 md:grid-cols-3`
   - 4 items: `grid-cols-2 md:grid-cols-4`
   - 5 items: `grid-cols-2 md:grid-cols-3` (3+2 bento, per existing KPI grid memory)
   - 6+ items: `grid-cols-2 md:grid-cols-3`

2. **Revenue and Liability section** (3 items): Change from `grid-cols-2 md:grid-cols-4` to `grid-cols-1 md:grid-cols-3` so all 3 tiles fill the row evenly

3. **Operations section** (4 items): Change from `grid-cols-2 md:grid-cols-3` to `grid-cols-2 md:grid-cols-4` so all 4 tiles fill one row on desktop, or 2x2 on mobile

4. Also update the loading skeleton grid to match (`grid-cols-2 md:grid-cols-3`)

### Result
- Revenue and Liability: 3 cards spanning the full width in one clean row
- Operations: 4 cards spanning the full width in one clean row on desktop, 2x2 on tablet/mobile
- If cards are added or removed in the future, the helper function adapts automatically

### Technical details
- Single file change: `src/components/dashboard/analytics/ExecutiveSummaryCard.tsx`
- Helper function: `getGridCols(count: number): string`
- Applied to both section grids via `className={cn('grid gap-4', getGridCols(items.length))}`
