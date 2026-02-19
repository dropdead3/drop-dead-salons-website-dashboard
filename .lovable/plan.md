

## Fix Compact Bento Tile Gaps, Metrics, and UI Polish

### Problems Identified

1. **Broken card: "SALES_DASHBOARD_BENTO"** -- A card ID exists in the user's pinned data that has no entry in `CARD_META`, so it renders the raw ID as both the label and the hero metric. Unknown card IDs need to be filtered out or given a graceful fallback with a human-readable label.

2. **Week Ahead Forecast shows its own name as the metric** -- When `forecastData?.summary` is null/loading, the fallback sets `metricValue = meta.label` ("Week Ahead Forecast"), which then renders as the hero metric text. Same pattern affects `service_mix`, `client_health`, and any card using `meta.label` as fallback.

3. **Operations Stats shows "---"** -- Hard-coded dash instead of real queue data.

4. **No info tooltips** -- None of the compact tiles explain what the metric means. Each tile needs a small (i) icon with a `MetricInfoTooltip` describing the metric.

5. **Inconsistent tile heights** -- Some tiles have "View X >" links, some do not. Tiles without links end up shorter. The layout needs consistent internal structure regardless of link presence.

6. **"0 NEW" renders as a large hero metric** -- All zero-state metrics should still display normally (this is correct behavior), but the label formatting could be cleaner.

### Plan (single file: `PinnedAnalyticsCard.tsx`)

| Change | Detail |
|--------|--------|
| Add `CARD_DESCRIPTIONS` map | A `Record<string, string>` mapping each cardId to a one-line explanation (e.g., "Total revenue from services and products in the selected period") |
| Add `MetricInfoTooltip` to each compact tile | Render the (i) icon next to the label in the tile header using the existing `MetricInfoTooltip` component |
| Fix fallback metrics | Replace `metricValue = meta.label` fallbacks with loading indicators ("--") so card names never appear as metric values |
| Handle unknown card IDs | If `cardId` is not in `CARD_META`, skip rendering (return null) in compact mode instead of showing raw IDs |
| Fix Operations Stats | Wire operations_stats to real queue data from the existing `OperationsQuickStats` data, or show a sensible placeholder ("View for details") |
| Standardize tile layout | Use `flex-1` on the metric section and always render the link row (even if empty) to keep consistent heights across the grid |
| Add missing `CARD_LINKS` entries | Ensure every card in `CARD_META` has a corresponding link so all tiles have a "View X >" action |

### Compact Tile Structure (after fix)

```text
+---------------------------------------------+
| [icon]  SALES OVERVIEW  (i)                  |
|                                              |
|  $12,450                                     |
|  revenue                                     |
|                                              |
|                            View Sales >      |
+---------------------------------------------+
```

- (i) icon uses existing `MetricInfoTooltip` component
- Metric area uses `flex-1` to push the link row to the bottom consistently
- Fallback for loading/missing data: "--" (not the card name)
- Unknown card IDs: filtered out (return null)

### Metric Descriptions (for tooltips)

| Card | Tooltip |
|------|---------|
| executive_summary | Total revenue across all services and products |
| daily_brief | Revenue generated today across all providers |
| sales_overview | Combined service and product revenue for the selected period |
| top_performers | Highest-earning team member by total revenue |
| operations_stats | Current queue activity including waiting and in-service clients |
| revenue_breakdown | Revenue split between services and retail products |
| client_funnel | Total unique clients (new and returning) in the period |
| client_health | Clients flagged as at-risk, win-back, or new-no-return |
| operational_health | Overall operational status across monitored locations |
| locations_rollup | Number of active locations in your organization |
| service_mix | Highest-revenue service category in the period |
| retail_effectiveness | Percentage of service transactions that include a retail purchase |
| rebooking | Percentage of clients who rebooked before leaving |
| team_goals | Team revenue progress toward the current period target |
| goal_tracker | Organization-wide goal completion percentage |
| capacity_utilization | Average chair utilization across all providers |
| week_ahead_forecast | Projected total revenue for the next 7 days |
| new_bookings | New appointments booked in the selected period |
| hiring_capacity | Open chair positions based on capacity analysis |
| staffing_trends | Count of currently active staff members |
| stylist_workload | Average utilization percentage across all stylists |

### Technical Details

- Import `MetricInfoTooltip` from `@/components/ui/MetricInfoTooltip`
- Add `CARD_DESCRIPTIONS: Record<string, string>` constant
- In the compact tile header, add `<MetricInfoTooltip description={CARD_DESCRIPTIONS[cardId]} />` after the label
- Replace all `metricValue = meta.label` fallbacks with `metricValue = '--'`
- Add early return `null` if `!CARD_META[cardId]` in compact mode
- Add missing entries to `CARD_LINKS` for cards that currently lack them (e.g., `locations_rollup`, `hiring_capacity`, `team_goals`)
- Restructure tile JSX to use `flex-1` on the metric `div` and a fixed-height bottom row for the link

One file modified. No database changes.
