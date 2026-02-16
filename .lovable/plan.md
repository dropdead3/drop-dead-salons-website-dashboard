

## Booking Pipeline Drill-Down (Operations Sub-Tab) — Refined

### What We're Building

A new **"Booking Pipeline"** sub-tab under Analytics > Operations that gives enterprise operators an at-a-glance view of which locations need attention. It answers: "Where should I focus marketing or outreach to fill the pipeline?"

### Enhancements Over Original Plan

1. **Single-pass data fetching** -- one forward query + one trailing query, grouped client-side by location. No N+1 problem.
2. **Zero-data guard** -- locations with 0 forward AND 0 trailing show "No Data" status (gray dot) instead of a misleading "Healthy."
3. **Clickable pipeline strip** -- the health indicator in `NewBookingsCard` becomes a `Link` to the drill-down page.
4. **Actionable next step for critical locations** -- each critical/slowing card gets a subtle "Boost Bookings" link pointing to the marketing module for that location, aligning with Zura's "what lever to pull" doctrine.

### UI Layout

```text
  BOOKING PIPELINE
  ─────────────────────────────────────────────────────────────
  [3 Critical]  [2 Slowing]  [8 Healthy]       Sort: [Severity v]

  ┌──────────────────────────────────────────────────────────┐
  │ [RED]  Downtown Dallas                        ratio: 43% │
  │ Critical · 12 next 14d vs 28 trailing                    │
  │ ████████░░░░░░░░░░░░░░░░░░░░░  43%                      │
  │                                    [Boost Bookings >]    │
  └──────────────────────────────────────────────────────────┘
  ┌──────────────────────────────────────────────────────────┐
  │ [AMBER]  Uptown                               ratio: 75% │
  │ Slowing · 18 next 14d vs 24 trailing                     │
  │ ██████████████████░░░░░░░░░░░  75%                       │
  │                                    [Boost Bookings >]    │
  └──────────────────────────────────────────────────────────┘
  ┌──────────────────────────────────────────────────────────┐
  │ [GREEN]  Frisco                              ratio: 110%  │
  │ Healthy · 22 next 14d vs 20 trailing                     │
  │ ██████████████████████████████ 110%                      │
  └──────────────────────────────────────────────────────────┘

  [Show all 13 locations]
```

### Key Design Decisions

- **Summary scoreboard** at top: colored chip counts (e.g., "3 Critical") act as toggle filters
- **Default sort**: Critical first (severity), with options for ratio ascending/descending and alphabetical
- **List capping**: Top 5 visible by default, "Show all X locations" toggle per existing standards
- **Progress bar**: Visually capped at 100%, label shows actual ratio percentage
- **Single-location orgs**: Shows just one card without ranking UI or filters
- **When a specific location is filtered** in the Analytics Hub filter bar, shows that single location's detailed view
- **"Boost Bookings"** link on critical/slowing locations routes to the marketing module (future-proofed; links to marketing tab or a placeholder)

### Zero-Data Guard

When both `forwardCount` and `baselineCount` are 0 for a location:
- Status: `no_data` (not "Healthy")
- Dot color: gray (`bg-muted-foreground/40`)
- Label: "No Data"
- Sorted last (after Healthy)

### Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useBookingPipelineByLocation.ts` | Single-pass hook: two Supabase queries (forward 14d + trailing 14d), joins with locations list, computes ratio/status per location, returns sorted array + summary counts |
| `src/components/dashboard/analytics/BookingPipelineContent.tsx` | Sub-tab UI: summary scoreboard, sortable/filterable location cards with progress bars, list capping, empty state |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/analytics/OperationsTabContent.tsx` | Add "Booking Pipeline" `SubTabsTrigger` wrapped in `VisibilityGate`, add `TabsContent` rendering `BookingPipelineContent` |
| `src/components/dashboard/analytics/ExecutiveSummaryCard.tsx` | Change Booking Pipeline KPI `drillDown` from `staff-utilization` to `booking-pipeline` (line 376) |
| `src/components/dashboard/NewBookingsCard.tsx` | Wrap the pipeline health strip in a `Link` to `/dashboard/admin/analytics?tab=operations&subtab=booking-pipeline` |

### Technical Details

**`useBookingPipelineByLocation` hook:**
- Two Supabase queries: forward (tomorrow to +14d) and trailing (-14d to today)
- Both select `id, location_id` without `head: true` so we get the actual rows (or use `.select('location_id')` for lighter payload)
- Group results by `location_id` client-side using a Map
- Join with the locations list (from `useLocations`) for names
- Compute ratio and status per location using the same thresholds as `useBookingPipeline` (healthy >= 0.9, slowing >= 0.7, critical < 0.7)
- Add `no_data` status when both counts are 0
- Return: `{ locations: LocationPipeline[], summary: { critical: number, slowing: number, healthy: number, noData: number }, isLoading: boolean }`

**`BookingPipelineContent` component props:**
- `locationId?: string` (from OperationsTabContent filter)
- `dateRange: string` (passed through for context, though pipeline is always 14d fixed)

**State:**
- `sortBy`: `'severity'` (default) | `'ratio-asc'` | `'ratio-desc'` | `'name'`
- `activeFilters`: `Set<'critical' | 'slowing' | 'healthy' | 'no_data'>` (all active by default, chips toggle)
- `showAll`: boolean for list capping

**Styling:**
- Location cards: `bg-muted/30 rounded-lg border border-border/50 p-4`
- Progress bar: existing `Progress` component with `indicatorClassName` set to status color
- Summary chips: `px-2 py-1 rounded-full text-xs font-display` with status-colored backgrounds
- "Boost Bookings" link: `text-xs text-muted-foreground hover:text-foreground` anchored bottom-right (same pattern as KpiTile "View" links)

