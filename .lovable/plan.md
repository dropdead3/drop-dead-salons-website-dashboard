
# Reorganize Available Analytics in Sensible Order

## Overview

Reorder the `PINNABLE_CARDS` array in `DashboardCustomizeMenu.tsx` to group cards logically by category, starting with Sales.

---

## Current Order (Disorganized)

```text
1. Operations Stats
2. Sales Dashboard
3. Sales Overview
4. Top Performers
5. Revenue Breakdown
6. Client Funnel
7. Team Goals
8. New Bookings
9. Week Ahead Forecast
10. Capacity Utilization
11. Hiring Capacity
12. Staffing Trends
13. Stylist Workload
```

---

## Proposed Order (Grouped by Category)

```text
SALES & REVENUE
1. Sales Dashboard        - Primary sales view
2. Sales Overview         - KPI summary
3. Revenue Breakdown      - Service vs Product split
4. Top Performers         - Stylist leaderboard

FORECASTING & GOALS
5. Week Ahead Forecast    - Revenue projections
6. Team Goals             - Target tracking
7. New Bookings           - Booking metrics

CLIENTS
8. Client Funnel          - Client retention/growth

OPERATIONS & CAPACITY
9. Operations Stats       - Daily operations overview
10. Capacity Utilization  - Booking capacity metrics
11. Stylist Workload      - Individual stylist capacity

STAFFING
12. Staffing Trends       - Team size over time
13. Hiring Capacity       - Hiring needs analysis
```

---

## Implementation

Update the `PINNABLE_CARDS` array order in `DashboardCustomizeMenu.tsx`:

```typescript
const PINNABLE_CARDS = [
  // Sales & Revenue
  { id: 'sales_dashboard_bento', label: 'Sales Dashboard', icon: <LayoutDashboard /> },
  { id: 'sales_overview', label: 'Sales Overview', icon: <DollarSign /> },
  { id: 'revenue_breakdown', label: 'Revenue Breakdown', icon: <PieChart /> },
  { id: 'top_performers', label: 'Top Performers', icon: <Trophy /> },
  
  // Forecasting & Goals
  { id: 'week_ahead_forecast', label: 'Week Ahead Forecast', icon: <TrendingUp /> },
  { id: 'team_goals', label: 'Team Goals', icon: <Target /> },
  { id: 'new_bookings', label: 'New Bookings', icon: <CalendarPlus /> },
  
  // Clients
  { id: 'client_funnel', label: 'Client Funnel', icon: <Users /> },
  
  // Operations & Capacity
  { id: 'operations_stats', label: 'Operations Stats', icon: <LayoutDashboard /> },
  { id: 'capacity_utilization', label: 'Capacity Utilization', icon: <Gauge /> },
  { id: 'stylist_workload', label: 'Stylist Workload', icon: <Briefcase /> },
  
  // Staffing
  { id: 'staffing_trends', label: 'Staffing Trends', icon: <LineChart /> },
  { id: 'hiring_capacity', label: 'Hiring Capacity', icon: <UserPlus /> },
];
```

---

## File to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardCustomizeMenu.tsx` | Reorder `PINNABLE_CARDS` array |

---

## Result

The Available Analytics list will display in a logical flow:
- **Sales first** (most commonly viewed)
- **Forecasting & Goals** (future-focused metrics)
- **Clients** (retention and funnel)
- **Operations** (day-to-day capacity)
- **Staffing** (team management)
