

# Tips Drill-Down with Enterprise-Scale Filters

## What This Does
Clicking the Tips stat card in AggregateSalesCard expands a drill-down panel showing per-stylist tip performance and per-category tip analysis. Designed for enterprise brands with thousands of employees by including region, location, and service category filters within the panel itself.

## Drill-Down Layout

```text
+---------------------------------------------------------------+
| TIPS PERFORMANCE                                               |
| [30 Days] [90 Days]   Region: [All v]  Location: [All v]      |
|                                                                |
| TOP TIP EARNERS (avg per service)                              |
| Name           Avg Tip   Tip %   No-Tip Rate   Total Tips     |
| ─────────────────────────────────────────────────────────────  |
| Sarah J.       $18.50    22%     8%            $740           |
| Marcus R.      $15.20    19%     12%           $608           |
| Amy L.         $12.00    15%     25%           $360           |
| ... Show all (47 stylists)                                     |
|                                                                |
| LOWEST AVG TIPS (coaching opportunities)                       |
| Name           Avg Tip   Tip %   No-Tip Rate   Total Tips     |
| ─────────────────────────────────────────────────────────────  |
| Kim T.         $4.00     6%      55%           $80            |
| Devon P.       $5.50     8%      42%           $132           |
|                                                                |
| BY SERVICE CATEGORY                                            |
| Color          $16.40 avg   18% tip rate                       |
| Blonding       $14.20 avg   16% tip rate                       |
| Haircut        $8.50 avg    20% tip rate                       |
+---------------------------------------------------------------+
```

## Enterprise-Scale Design Decisions

### Filter Architecture (inside the panel)
- **Time Toggle**: 30 Days (default) / 90 Days -- simple toggle buttons, not tied to the parent card's date range since tips analysis benefits from a longer lookback
- **Region Filter**: Reuses the existing `availableRegions` and `locationRegionMap` patterns already built in AggregateSalesCard (lines 250-267). Dropdown filters stylists by their assigned location's region
- **Location Filter**: Cascading -- when a region is selected, the location dropdown only shows locations within that region. Defaults to "All"
- **Pagination**: Top 10 shown by default with "Show all" toggle (avoids rendering 1000+ rows on load)

### Two Ranked Sections
- **Top Tip Earners**: Sorted descending by avg tip -- shows leadership who's earning well
- **Lowest Avg Tips**: Bottom 5 stylists with meaningful volume (minimum 10 appointments filter to avoid noisy data) -- coaching signal for managers

### Metrics Per Stylist
| Metric | What It Shows | Why It Matters |
|--------|--------------|----------------|
| Avg Tip | Average tip dollar per appointment | Raw earning power |
| Tip % | Tips as % of service revenue | Normalizes across price points |
| No-Tip Rate | % of appointments with $0 tip | Coaching opportunity signal |
| Total Tips | Sum in period | Volume context |

### By Service Category (bottom section)
- Avg tip and tip rate per category
- Reuses the `CategoryBreakdownPanel` visual pattern with horizontal bars

## Technical Changes

### 1. New Hook: `src/hooks/useTipsDrilldown.ts`
- Queries `phorest_appointments` for the selected 30/90 day period
- SELECT: `phorest_staff_id`, `tip_amount`, `total_price`, `service_category`, `appointment_date`
- WHERE: status NOT IN ('cancelled', 'no_show'), `tip_amount` is not null or 0 tracked
- Accepts optional `locationId` param for filtering
- Joins `phorest_staff_mapping` and `employee_profiles` for stylist names and photos
- Returns two structures:
  - `byStylist`: array of stylist objects with avg tip, tip %, no-tip rate, total tips, appointment count
  - `byCategory`: Record of category name to { avgTip, tipRate, count }
- Minimum appointment threshold param (default 10) to filter out noisy low-volume data

### 2. New Component: `src/components/dashboard/sales/TipsDrilldownPanel.tsx`
- Receives: `isOpen`, `parentLocationId` (from AggregateSalesCard's filter context)
- Internal state: `period` (30 | 90), `regionFilter`, `locationFilter`
- Derives region/location options from `useActiveLocations()` (same pattern as AggregateSalesCard lines 250-267)
- Cascading filter: region selection narrows location dropdown
- Sections:
  1. Filter bar (time toggle + region + location dropdowns)
  2. Top Earners table (top 10 with "show all" expansion)
  3. Coaching Opportunities (bottom 5 by avg tip, min volume filter)
  4. Category breakdown (reuses horizontal bar pattern)
- AnimatePresence for expand/collapse animation
- Empty state: "No tip data recorded for this period"

### 3. Modify: `src/components/dashboard/AggregateSalesCard.tsx`
- Add `tipsDrilldownOpen` boolean state
- Make the Tips div (lines 632-645) clickable with hover effect and ChevronDown indicator
- Render `TipsDrilldownPanel` below the secondary KPIs row when open
- Pass `filterContext?.locationId` as `parentLocationId` so the panel respects the card's location filter as a default

### File Summary

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useTipsDrilldown.ts` | Create | Hook to aggregate tip metrics by stylist and category |
| `src/components/dashboard/sales/TipsDrilldownPanel.tsx` | Create | Expandable panel with filters, ranked tables, category breakdown |
| `src/components/dashboard/AggregateSalesCard.tsx` | Modify | Make Tips card clickable, render drill-down panel |

No database changes needed -- all data comes from existing `phorest_appointments` fields.

