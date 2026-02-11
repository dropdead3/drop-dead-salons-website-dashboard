
# Add Subtle Border Strokes to Location Detail Cells

## Problem
The expanded location detail cells (Services, Products, Transactions, Avg Ticket, Trend, Status) inside the "By Location" section of the AggregateSalesCard lack border definition in dark mode -- they blend into the card background.

## Change

### File: `src/components/dashboard/AggregateSalesCard.tsx`
Add `border border-border/30` to each of the 6 detail cells in the expanded location row:

- **Line 775** (Services): `bg-muted/30 rounded-lg p-3` → add `border border-border/30`
- **Line 782** (Products): same
- **Line 789** (Transactions): same
- **Line 796** (Avg Ticket): same
- **Line 803** (Trend): same
- **Line 817** (Status): same

This is the identical treatment applied to the ForecastingCard KPI cells. 6 className additions, 1 file, no structural changes.
