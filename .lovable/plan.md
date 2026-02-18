

## Client Visits Analytics Card for Staff Performance Tab

### What We're Building

A "Client Visits" analytics card inspired by the reference screenshot, adapted to the Zura luxury aesthetic and enriched with drill-down intelligence. The card answers: **"How many client visits did each stylist handle, and how is that trending?"**

It sits on the Staff Performance subtab (`/dashboard/admin/analytics?tab=sales&subtab=staff`) alongside the existing Staff Performance leaderboard, Peak Hours Heatmap, and Client Funnel cards.

### Card Layout (Two Panels)

```text
+------------------------------+-----------------------------------------------+
|                              |                                               |
|            148               |     CLIENT VISITS BREAKDOWN          (i)      |
|                              |                                               |
|    CLIENT VISITS  (i)        |   [=== Bar Chart by Stylist ===]              |
|                              |   Alexis H.   |████████████████| 40           |
|    ▲ 8.2%                    |   Cienna R.   |██████████████  | 38           |
|    vs prior period           |   Jamie V.    |█████████████   | 36           |
|                              |   ...                                         |
+------------------------------+-----------------------------------------------+
```

**Left panel**: Hero KPI with total visit count, period-over-period change badge, and a `MetricInfoTooltip`.

**Right panel**: Horizontal bar chart (Recharts `BarChart` with `layout="vertical"`) showing visits per stylist, sorted descending. Bars use `hsl(var(--primary))` with the luxury glass gradient pattern. Count labels appear at bar ends.

### Drill-Down (Click a Stylist Bar)

Clicking a bar expands an inline `framer-motion` panel showing that stylist's visit details:
- **Service Mix**: Top 5 services by visit count
- **New vs Returning**: Split of new vs returning client visits
- **Average Ticket**: Revenue per visit for this stylist
- Navigation link to the stylist's full profile page

### Data Hook

**New file**: `src/hooks/useClientVisitsByStaff.ts`

Queries `phorest_appointments` for the selected date range and an equivalent prior period (same duration, immediately preceding). Groups by `phorest_staff_id`, resolves staff names via `phorest_staff_mapping` + `employee_profiles`, and calculates:

- `totalVisits`: Count of non-cancelled/no-show appointments per stylist
- `priorVisits`: Same count for the prior period
- `percentChange`: Period-over-period change
- `newClientVisits`: Count where `is_new_client = true`
- `returningClientVisits`: Remainder
- `topServices`: Top 5 service names by frequency
- `avgTicket`: Average `total_price` per visit

Returns both the aggregate totals and per-stylist breakdown. Uses manual pagination via `.range()` per project standards for high-volume orgs.

Accepts `dateFrom`, `dateTo`, and optional `locationId` parameters.

### UI Component

**New file**: `src/components/dashboard/sales/ClientVisitsCard.tsx`

- Wrapped in `PinnableCard` for Command Center pinning
- Two-column `justify-between` header with icon + title on left, `AnalyticsFilterBadge` on right
- Left KPI panel uses `tokens.stat.large` for the hero number
- Period change uses a `ChangeBadge`-style indicator (green up arrow / red down arrow)
- Right panel uses Recharts `BarChart` with `layout="vertical"`, `YAxis` showing truncated stylist names, bars with glass gradient fills
- Click handler on bars triggers drill-down expansion
- Loading state: Skeleton matching the two-panel layout
- Empty state: Standard `tokens.empty` pattern

### Integration

**Modified file**: `src/components/dashboard/analytics/SalesTabContent.tsx`

Add the `ClientVisitsCard` to the `staff` TabsContent section, positioned before the existing Staff Performance leaderboard (visits are a foundational metric that contextualizes revenue). Wrapped in `PinnableCard` with the standard element key and category props.

### Technical Details

- **Files created**: `src/hooks/useClientVisitsByStaff.ts`, `src/components/dashboard/sales/ClientVisitsCard.tsx`
- **Files modified**: `src/components/dashboard/analytics/SalesTabContent.tsx` (add card to staff subtab)
- **Patterns followed**: Manual pagination via `.range()`, `PinnableCard` wrapper, `AnalyticsFilterBadge` in header right column, `MetricInfoTooltip`, `BlurredAmount` for currency values, `tokens` design system, `framer-motion` for drill-down expansion
- **Period comparison**: Computed by calculating the duration of `dateFrom` to `dateTo`, then querying the same duration immediately prior. Change displayed as percentage with directional icon
- **Bar chart**: Recharts `BarChart` with `layout="vertical"`, `hsl(var(--primary))` fill with SVG linear gradient (0.45 to 0.18 opacity), 1px glass stroke, count labels via custom `<Label>` on bars

