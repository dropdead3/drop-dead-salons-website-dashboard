
# Add Goal Pace Indicator to Sales Goal Progress

## What Changes

Enhance `SalesGoalProgress.tsx` to show whether the operator is behind, on track, or on pace to surpass the goal. This adds a third line below the progress bar with a colored status badge.

### Pace Calculation Logic

The component needs to know how far through the current period we are to determine expected progress:

- **Weekly Goal**: days elapsed this week / 7
- **Monthly Goal**: day of month / days in month
- **Yearly Goal**: day of year / days in year

Compare `actual %` vs `expected %`:
- **Ahead** (actual >= expected + 5%): Green badge -- "On pace to surpass goal" with TrendingUp icon
- **On Track** (within 5% of expected): Amber/neutral badge -- "On track" with Target icon  
- **Behind** (actual < expected - 5%): Red/warning badge -- "Behind pace -- need $X/day to catch up" with TrendingDown icon

### UI Addition

Below the existing "earned / to go" row, add a small status line:

```
$1,815 earned                              $17,418 to go
[TrendingDown] Behind pace · $2,488/day needed to hit goal
```

- Uses `text-[11px]` muted styling, colored by status
- When goal is reached, this line is hidden (the existing "Goal reached!" message suffices)

### Props Change

Add an optional `goalPeriod` prop to `SalesGoalProgress`:

```typescript
goalPeriod?: 'weekly' | 'monthly' | 'yearly'
```

This tells the component which calendar period to calculate expected pace against. Defaults to `'monthly'`.

## Technical Details

| File | Change |
|---|---|
| `src/components/dashboard/sales/SalesGoalProgress.tsx` | Add `goalPeriod` prop; compute elapsed fraction, expected revenue, pace status; render status badge below progress bar |
| `src/components/dashboard/AggregateSalesCard.tsx` | Pass `goalPeriod` prop based on `dateRange` (weekly/monthly/yearly) |
| `src/pages/dashboard/admin/SalesDashboard.tsx` | Pass `goalPeriod` prop similarly |
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Pass `goalPeriod` prop if `SalesGoalProgress` is used there |
