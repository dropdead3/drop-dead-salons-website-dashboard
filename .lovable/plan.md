

## Simple / Detailed View Toggle for Command Center Analytics

### What It Does

Adds a toggle in the analytics filter bar that lets the user switch between:

- **Detailed view** (current default): Full analytics cards with charts, grids, and drill-downs
- **Simple view**: Each pinned card collapses to a single compact row showing the card name, icon, and its most important metric -- still looks like a dashboard, just tightened up

The widgets section remains untouched.

### User Experience

The toggle appears as a small icon button (grid/list icon) next to the existing location and date filters in the analytics header bar. Preference is persisted in localStorage so it survives page reloads.

Simple view renders each pinned card as a slim horizontal card (~56px tall) with:
- Card icon (left)
- Card name
- Primary metric value (right-aligned, prominent)
- Trend indicator if available

All cards stack vertically in a tight grid, giving an executive "at a glance" feel.

### Technical Plan

| Step | File | Change |
|------|------|--------|
| 1 | `src/components/dashboard/PinnedAnalyticsCard.tsx` | Add `compact` prop. When true, render a slim summary row instead of the full card. Map each `cardId` to its key metric label and extract the value from already-fetched data (salesData, performers, queueData, etc.) |
| 2 | `src/components/dashboard/AnalyticsFilterBar.tsx` | Add a Simple/Detailed toggle button (LayoutGrid / List icon) to the filter bar. Accept `compact` and `onCompactChange` props |
| 3 | `src/pages/dashboard/DashboardHome.tsx` | Add `compact` state (persisted to localStorage key `cc-view-mode`). Pass it down to `AnalyticsFilterBar` and to each `PinnedAnalyticsCard` |

### Compact Card Design

Each card in simple mode becomes a single `Card` row:

```text
+----------------------------------------------------------+
| [icon]  Daily Brief          $4,230 revenue    +2.1%     |
+----------------------------------------------------------+
| [icon]  Sales Overview       $12,450 total      -1.3%    |
+----------------------------------------------------------+
| [icon]  Top Performers       Sarah M. (#1)     $3,200    |
+----------------------------------------------------------+
```

- Uses existing data hooks already called in `PinnedAnalyticsCard`
- Each cardId maps to a summary extractor function that picks the single most important number
- The PinnableCard hover interaction (Zura AI + pin icons) still works on the compact row
- Cards remain individually removable/reorderable

### Metric Mapping Per Card

| Card | Simple View Shows |
|------|-------------------|
| executive_summary | Total Revenue + change % |
| daily_brief | Today's Revenue |
| sales_overview | Total Revenue + change % |
| top_performers | #1 performer name + revenue |
| operations_stats | Total in queue (waiting + in service) |
| revenue_breakdown | Service vs Product split |
| client_funnel | Total clients |
| client_health | Total needing attention |
| operational_health | Overall health score |
| locations_rollup | Location count + top performer |
| service_mix | Top service category |
| retail_effectiveness | Attachment rate % |
| rebooking | Rebooking rate % |
| team_goals | Progress % toward goal |
| capacity_utilization | Utilization % |
| All others | Card name only (graceful fallback) |

Three files modified. No database changes. Widgets section untouched.

