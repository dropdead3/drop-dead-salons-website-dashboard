

## Returning Clients Overview and Rebooking Overview Cards

Two new analytics cards for the Staff Performance subtab, inspired by the reference screenshot and built to the Zura luxury aesthetic with drill-down intelligence.

### Card 1: Returning Clients Overview

Answers: "What percentage of each stylist's clients are returning, and how does the team compare?"

**Layout**: Same two-panel pattern as Client Visits card.
- Left panel: Hero KPI showing overall "% Returning" with period-over-period change badge and MetricInfoTooltip
- Right panel: Vertical bar chart showing "% Returning Breakdown" per stylist, sorted highest to lowest

**Drill-down**: Clicking a bar expands an inline panel showing:
- Total appointments for that stylist
- New vs returning count split
- Average ticket for returning clients vs new clients (comparison)

**Data source**: Extends `useClientVisitsByStaff` -- the hook already calculates `newClientVisits` and `returningClientVisits` per stylist. The component will derive `% returning = returningClientVisits / totalVisits * 100` and compute the overall team average. For period-over-period, a small enhancement to the hook adds prior-period returning counts.

### Card 2: Rebooking Overview

Answers: "What percentage of each stylist's completed appointments result in a rebooking, and how is that trending?"

**Layout**: Same two-panel pattern.
- Left panel: Hero KPI showing overall "% Rebooked" with period-over-period change badge and MetricInfoTooltip
- Right panel: Vertical bar chart showing "% Rebooked Breakdown" per stylist, sorted highest to lowest

**Drill-down**: Clicking a bar expands an inline panel showing:
- Total completed appointments
- Rebooked count and rate
- Average ticket for rebooked vs not-rebooked appointments

**Data source**: New hook `useRebookingByStaff` querying `phorest_appointments` for the `rebooked_at_checkout` boolean field (already used extensively in the codebase). Groups by `phorest_staff_id`, calculates per-stylist rebooking rate and team average, plus prior-period comparison.

### Technical Details

**New files:**
- `src/hooks/useRebookingByStaff.ts` -- Queries `phorest_appointments` with fields `phorest_staff_id, rebooked_at_checkout, total_price, status`, filters out cancelled/no-show, groups by staff. Uses manual pagination via `.range()`. Calculates per-stylist and aggregate rebooking rates with prior-period comparison.
- `src/components/dashboard/sales/ReturningClientsCard.tsx` -- Two-panel card using data from `useClientVisitsByStaff`. Derives returning percentages client-side. Standard header with icon (UserCheck) + AnalyticsFilterBadge. Recharts vertical BarChart with glass gradient fills, percentage labels on bars. Active-bar highlighting and framer-motion drill-down.
- `src/components/dashboard/sales/RebookingOverviewCard.tsx` -- Two-panel card using `useRebookingByStaff`. Standard header with icon (RefreshCw) + AnalyticsFilterBadge. Same chart and drill-down patterns.

**Modified files:**
- `src/hooks/useClientVisitsByStaff.ts` -- Add prior-period returning client counts to enable period-over-period change on the Returning Clients card. The current hook already fetches prior-period data but only returns `priorTotalVisits`; it needs to also return `priorReturningCount`.
- `src/components/dashboard/analytics/SalesTabContent.tsx` -- Add both cards to the `staff` TabsContent, positioned after the Client Visits card and before the Staff Performance leaderboard. Each wrapped in PinnableCard.

**Design compliance:**
- `tokens.card.wrapper` on all Card states
- Two-column `justify-between` header with AnalyticsFilterBadge
- `tokens.stat.large` for hero percentage
- Glass gradient bars with `hsl(var(--primary))` and active-bar highlighting
- `framer-motion` drill-down with "Click a bar to explore" hint
- `tokens.body.emphasis` and `tokens.body.muted` for drill-down labels
- React Router `Link` for any profile navigation
- BlurredAmount for currency values in drill-down
- Skeleton loading states matching two-panel layout
- Empty state using `tokens.empty` pattern
- Bar percentage labels at bar tops (e.g., "67%", "20%")

**Hook data structure (useRebookingByStaff):**
```text
Returns:
  overallRate: number (aggregate % rebooked)
  priorOverallRate: number
  percentChange: number | null
  staffBreakdown: Array of {
    staffId, staffName, userId,
    totalAppointments, rebookedCount, rebookingRate,
    avgTicketRebooked, avgTicketNotRebooked
  }
```

**Hook enhancement (useClientVisitsByStaff):**
```text
Adds to return object:
  overallReturningRate: number
  priorReturningRate: number
  returningPercentChange: number | null
```
The prior-period fetch already exists; the enhancement extracts `is_new_client` from the prior data (currently only fetches `phorest_staff_id, status`).
