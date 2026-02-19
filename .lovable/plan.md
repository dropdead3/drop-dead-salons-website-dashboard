

## Capitalize and Enrich Analytics Card Sub-Labels

### Problem
The metric sub-labels below each hero number ("revenue", "bookings", "on track") are lowercase and generic. They should be uppercase (matching the card's Termina/display conventions) and more descriptive to give users better context at a glance.

### Changes

**File: `src/components/dashboard/PinnedAnalyticsCard.tsx`**

#### 1. Update sub-label styling (line 484)

Change from:
```
text-xs text-muted-foreground/80 mt-1
```
to:
```
font-display text-[11px] tracking-[0.08em] uppercase text-muted-foreground/80 mt-1
```

This applies Termina with the standard display tracking, matching the card title convention and creating typographic cohesion.

#### 2. Enrich label content across the switch cases

| Card | Current Label | New Label |
|------|--------------|-----------|
| sales_overview | revenue | Total Revenue |
| daily_brief | today | Today's Revenue |
| top_performers | #1 | Top Performer |
| revenue_breakdown | svc / retail | Service / Retail Split |
| retail_effectiveness | attach rate | Retail Attachment Rate |
| rebooking | rebook | Rebooking Rate |
| team_goals | progress | Team Progress |
| capacity_utilization | utilization | Avg Utilization |
| operational_health | status | System Status |
| service_category_breakdown | top | Top Category |
| client_funnel | total | Total Clients |
| goal_tracker | on track / ahead / behind | On Track / Ahead of Pace / Behind Pace |
| week_ahead_forecast | 7-day revenue | 7-Day Projected Revenue |
| week_ahead_forecast (loading) | loading | Loading Forecast |
| new_bookings | bookings | Recent Bookings |
| hiring_capacity | chair / chairs | Open Chairs |
| staff_workload | staff | Active Staff |
| workload_utilization | avg util | Avg Utilization |
| client_queue | (unchanged -- already descriptive) | (unchanged) |

### Technical Detail

- The uppercase transform is handled by CSS (`uppercase` class), so the label strings themselves are written in Title Case for readability in code
- Uses `font-display` (Termina) at 11px with 0.08em tracking, matching `tokens.kpi.label` conventions
- No new dependencies or data changes

