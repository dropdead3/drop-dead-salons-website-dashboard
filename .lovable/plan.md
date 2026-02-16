
# Retail Sales by Staff Card -- Enhancement

## Current State

The "Staff Retail Performance" table already exists inside `RetailAnalyticsContent.tsx` (lines 423-493). It displays: Rank, Stylist (avatar + name), Product Revenue, Units Sold, Attachment Rate, and Avg Ticket. Data comes from the `useRetailAnalytics` hook which aggregates `phorest_transaction_items`.

**What it lacks:**
- No column sorting (revenue, units, name, attachment rate, avg ticket)
- No search/filter within the card
- No ability to sort alphabetically or toggle high-to-low / low-to-high
- Location and date range are inherited from the parent filter bar (which is fine, but the card has no internal filter controls)

## Plan

### 1. Add Interactive Column Sorting

Add `ArrowUpDown` sort toggles to every column header in the Staff Retail Performance table:
- **Stylist** (alphabetical A-Z / Z-A via `localeCompare`)
- **Product Revenue** (highest to lowest / lowest to highest) -- default sort
- **Units Sold**
- **Attachment Rate**
- **Avg Ticket**

Use local state (`sortKey` / `sortDir`) with a `useMemo` to sort the `staffRetail` array, matching the exact pattern already used in the Product Performance table above it (lines 61-62, 112-126).

### 2. Add Staff Search

Add a search input in the card header (same pattern as the Product Performance card, line 195-198) that filters by stylist name.

### 3. Ensure Card Always Renders

Currently the card is wrapped in `{data.staffRetail.length > 0 && ...}` which hides it entirely when empty. Change this to always render, showing an empty state message ("No staff retail data in this period") when there are no results, consistent with the Product Performance table pattern.

### 4. Gap Analysis and Suggested Enhancements

After building sorting and search, here are additional enhancements worth considering:

- **Drill-down per stylist**: Clicking a staff row could expand (framer-motion) to show their top products sold, matching the nested breakdown pattern used elsewhere
- **"Coaching Opportunity" flag**: Highlight the stylist with the lowest attachment rate (minimum volume threshold) so managers can identify coaching targets
- **Export**: The parent page already has CSV/PDF export, so this is covered
- **Trend column**: Add a prior-period comparison for each stylist's retail revenue (the prior period data is already fetched in `useRetailAnalytics` but not broken down by staff -- would require extending the hook)

## Technical Details

**File modified:** `src/components/dashboard/analytics/RetailAnalyticsContent.tsx`

1. Add state variables for staff sort: `staffSortKey` (type: `'name' | 'productRevenue' | 'unitsSold' | 'attachmentRate' | 'avgTicket'`) and `staffSortDir` (`'asc' | 'desc'`), default to `productRevenue` / `desc`
2. Add `staffSearch` state
3. Add `useMemo` that filters by search and sorts `data.staffRetail` using the selected key/direction
4. Add `toggleStaffSort` handler (same pattern as existing `toggleSort`)
5. Update table headers to include `ArrowUpDown` icons and `onClick` handlers
6. Add search input in the card header
7. Remove the `data.staffRetail.length > 0` conditional wrapper; show empty state inside the table body instead

No hook changes, no database changes, no new files.
