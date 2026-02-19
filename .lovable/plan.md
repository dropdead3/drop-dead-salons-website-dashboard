

## Update Analytics Card Sub-Labels: Aeonik Pro + Richer Context

### Problem
The sub-labels below hero numbers are currently set in Termina (`font-display`) with full uppercase -- they should be in Aeonik Pro (`font-sans`) with only the first letter capitalized. The descriptions also need to be longer and more contextual to give users clearer meaning at a glance.

### Changes (single file: `src/components/dashboard/PinnedAnalyticsCard.tsx`)

#### 1. Typography fix (line 484)

Change from:
```
font-display text-[11px] tracking-[0.08em] uppercase text-muted-foreground/80 mt-1
```
to:
```
text-xs text-muted-foreground/80 mt-1
```

This switches back to Aeonik Pro (the default `font-sans`) and removes `uppercase` and the Termina tracking. The label strings themselves will be written in sentence case (first letter capitalized).

#### 2. Enrich label content with longer, more contextual descriptions

| Card | Current Label | New Label |
|------|--------------|-----------|
| sales_overview | Total Revenue | Total revenue across all services and retail |
| daily_brief | Today's Revenue | Revenue earned so far today |
| top_performers | Top Performer | Highest earning team member this period |
| client_queue | (waiting/in service) | (unchanged -- already contextual) |
| revenue_breakdown | Service / Retail Split | Service revenue vs. retail product revenue |
| retail_effectiveness | Retail Attachment Rate | Percentage of service tickets with retail add-ons |
| rebooking | Rebooking Rate | Clients who rebooked before leaving |
| team_goals | Team Progress | Combined team revenue toward goal |
| capacity_utilization | Avg Utilization | Average chair utilization across locations |
| operational_health | System Status | Monitoring status across all locations |
| service_category_breakdown | Top Category | Highest revenue service category |
| client_funnel | Total Clients | New and returning clients this period |
| goal_tracker | On Track / Ahead of Pace / Behind Pace | On track to hit goal / Ahead of target pace / Falling behind target pace |
| week_ahead_forecast | 7-Day Projected Revenue | Projected revenue for the next 7 days |
| week_ahead_forecast (loading) | Loading Forecast | Loading forecast data |
| new_bookings | Recent Bookings | New bookings placed this period |
| hiring_capacity | Open Chairs | Chairs available for new hires |
| staff_workload | Active Staff | Currently active team members |
| workload_utilization | Avg Utilization | Average utilization across active staff |

### Technical Detail

- Uses default `font-sans` (Aeonik Pro) -- no font family class needed
- Sentence case is handled by writing the strings naturally (no CSS `uppercase`)
- `text-xs` with `text-muted-foreground/80` keeps labels secondary to the hero metric
- No new dependencies or data changes
- One file modified

