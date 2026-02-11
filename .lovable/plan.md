

# Add Border Definition to Forecasting Card Internal KPIs

## Problem
The three summary stat cells in the Forecasting card (7-Day Total, Daily Avg, Appointments) use `bg-muted/30 rounded-lg` without any border, making them hard to distinguish in dark mode -- the same issue we just fixed on the other cards.

## Change

### File: `src/components/dashboard/sales/ForecastingCard.tsx`
- **Line 530**: `bg-muted/30 rounded-lg` -- add `border border-border/30`
- **Line 545**: `bg-muted/30 rounded-lg` -- add `border border-border/30`
- **Line 560**: `bg-muted/30 rounded-lg` -- add `border border-border/30`

All three KPI cells get the same `border border-border/30` treatment already applied to the AggregateSalesCard KPI cells.

Total: 3 className additions in 1 file. No structural or behavioral changes.
