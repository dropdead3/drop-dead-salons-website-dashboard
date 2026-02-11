

# Add Daily Average Sales Metric to Sales Overview

## What Changes

The Sales Overview card currently shows three secondary KPIs: **Transactions**, **Avg Ticket**, and **Rev/Hour**. For any date range other than "today," a fourth metric -- **Daily Avg** -- will be added, showing total revenue divided by the number of days in the selected range.

When the range is "today," this metric is hidden (a single day's average is just the total).

---

## Implementation

### File: `src/components/dashboard/AggregateSalesCard.tsx`

1. **Calculate days in range**: Derive the number of calendar days between `dateFrom` and `dateTo` using `differenceInCalendarDays` from date-fns (add 1 to include both endpoints).

2. **Compute daily average**: `totalRevenue / daysInRange`.

3. **Add a 4th metric tile** in the secondary KPIs row (lines ~548-595): When `dateRange !== 'today'`, change the grid from `grid-cols-3` to `grid-cols-4` and insert a "Daily Avg" tile with a Calendar icon and the computed value.

4. **Tooltip**: Include a MetricInfoTooltip reading "Total Revenue divided by number of days in the selected range."

### No other files change

The data already exists -- this is purely a UI calculation using the existing `displayMetrics.totalRevenue` and the date filter boundaries.

---

## Technical Detail

```text
import { differenceInCalendarDays } from 'date-fns';

const daysInRange = differenceInCalendarDays(
  new Date(dateFilters.dateTo), 
  new Date(dateFilters.dateFrom)
) + 1;

const dailyAverage = daysInRange > 0 ? displayMetrics.totalRevenue / daysInRange : 0;
const showDailyAvg = dateRange !== 'today';

// Grid changes from grid-cols-3 to conditional:
// showDailyAvg ? 'grid-cols-4' : 'grid-cols-3'
```

The new tile mirrors the existing style (centered, icon, AnimatedBlurredAmount, label + tooltip).
