

## Consolidate Three Staff Cards into One "Client Engagement" Card

### Why Consolidate

The three cards (Client Visits, Returning Clients, Rebooking Overview) are closely related:
- All query the same `phorest_appointments` table
- All group by stylist with the same bar chart layout
- All use the same two-panel (hero KPI + bar chart) structure
- Client Visits and Returning Clients already share the same data hook, meaning the same query runs twice
- They occupy three full-width card slots on the page when they could be one powerful card with three "lenses"

Consolidating them reduces page scroll, eliminates redundant data fetching, and creates a richer, more interactive single card that tells a complete client engagement story.

### New Design: Single "Client Engagement" Card

```text
+----------------------------------------------------------------------+
| [Users icon]  CLIENT ENGAGEMENT  (i)     [Visits|Retention|Rebooking] |
|               Client behavior by stylist       All Locations | Today  |
+----------------------------------------------------------------------+
|                         |                                             |
|     148                 |  VISITS BY STYLIST  (when Visits selected)  |
|   TOTAL VISITS          |  Alexis H.   |██████████████| 40           |
|   ▲ 8.2% vs prior      |  Cienna R.   |████████████  | 38           |
|                         |  Jamie V.    |███████████   | 36           |
|                         |  ...                                       |
+-------------------------+---------------------------------------------+
|  [Drill-down panel when bar clicked]                                  |
+----------------------------------------------------------------------+
```

The header right column contains a `FilterTabsList` toggle with three options:
- **Visits**: Shows total visit count per stylist (current Client Visits)
- **Retention**: Shows % returning per stylist (current Returning Clients)
- **Rebooking**: Shows % rebooked per stylist (current Rebooking Overview)

The hero KPI on the left dynamically changes based on the active view:
- Visits: "148 TOTAL VISITS" with PoP change
- Retention: "72% RETURNING" with PoP change
- Rebooking: "45% REBOOKED" with PoP change

The drill-down panel adapts its content to the active view:
- Visits: New vs Returning split, Average Ticket, Top 5 Services
- Retention: Total Appointments, New/Returning counts, Average Ticket, Returning Rate
- Rebooking: Total Appointments, Rebooked Count/Rate, Avg Ticket Rebooked vs Not

### Data Hook: Combined `useClientEngagement`

A single hook that fetches all three datasets in one query pass. Instead of two separate hooks making redundant calls, this hook queries `phorest_appointments` once with all needed fields (`phorest_staff_id, is_new_client, rebooked_at_checkout, total_price, service_name, status`) and computes all three views from the same dataset. This halves the number of database round-trips.

Returns a unified structure:
- `visits`: total count, PoP change, per-staff breakdown with top services and avg ticket
- `retention`: overall returning rate, PoP change, per-staff returning percentage
- `rebooking`: overall rebooked rate, PoP change, per-staff rebooking rate and ticket comparison

### Technical Details

**Files created:**
- `src/hooks/useClientEngagement.ts` -- Combined hook fetching all fields in one paginated pass, computing visits, retention, and rebooking data from the same result set
- `src/components/dashboard/sales/ClientEngagementCard.tsx` -- Unified card with view toggle, dynamic hero KPI, and view-aware drill-down

**Files deleted:**
- `src/components/dashboard/sales/ClientVisitsCard.tsx`
- `src/components/dashboard/sales/ReturningClientsCard.tsx`
- `src/components/dashboard/sales/RebookingOverviewCard.tsx`
- `src/hooks/useClientVisitsByStaff.ts` (only if no other consumers)
- `src/hooks/useRebookingByStaff.ts`

**Files modified:**
- `src/components/dashboard/analytics/SalesTabContent.tsx` -- Replace three card imports/instances with one `ClientEngagementCard`

**Design compliance:**
- View toggle uses `FilterTabsList` / `FilterTabsTrigger` in the header right column (this is a view-level toggle per card header rules, not a sort toggle)
- Single `AnalyticsFilterBadge` in header right column
- `tokens.card.wrapper`, `tokens.card.iconBox`, `tokens.card.title` on header
- Glass gradient bars with active-bar highlighting (reused gradient pattern)
- `framer-motion` drill-down with "Click a bar to explore" hint
- Bar labels show counts for Visits view, percentages for Retention/Rebooking views
- `XAxis domain` adjusts: unbounded for Visits, `[0, 100]` for percentage views
- Skeleton and empty states match the two-panel layout
- All design tokens, React Router `Link`, `AnimatedBlurredAmount` patterns preserved

**Additional fix -- staff name resolution:**
The staff name fallback currently shows raw Phorest IDs when no mapping exists. The new hook will add a secondary fallback: if neither mapping nor `phorest_staff_name` exists, it will query the appointment's own `staff_name` field (if available) before falling back to a truncated ID with an ellipsis, so the chart is more readable even with incomplete mapping data.

