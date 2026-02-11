

# Daily Average: Use Working Days, Not Calendar Days

## Problem

The Daily Avg metric currently divides total revenue by all calendar days in the range (e.g., 7 days for "Last 7 Days"). Since the salon is closed 2 days per week with $0 in sales, this deflates the average and misrepresents daily performance.

## Solution

Instead of counting calendar days, count the **distinct days that actually had transactions** in the selected range. This automatically handles closed days, holidays, and any other non-operating days without needing a hardcoded schedule.

For the screenshot example: $3,836 across ~3 working days = ~$1,279/day (which happens to match, suggesting the current range has 3 active days out of the week so far).

## Implementation

### File: `src/components/dashboard/AggregateSalesCard.tsx`

**Current logic (line ~550-554):**
```
daysInRange = differenceInCalendarDays(dateTo, dateFrom) + 1
dailyAverage = totalRevenue / daysInRange
```

**New logic:**
- The aggregate sales data already comes from a hook that queries `phorest_sales`. Query for distinct `sale_date` values within the range to get the count of days with actual sales activity.
- Alternatively (simpler, no extra query): the location breakdown data or the sales query already returns per-row sale dates. Count unique `sale_date` values from the existing data to derive working days.
- Compute: `dailyAverage = totalRevenue / workingDays`
- Update the tooltip to read: "Average daily revenue across days with recorded sales."
- If zero working days (no sales at all), show $0.

### Determining working days without an extra query

The existing `useAggregateSales` hook fetches sales rows. I need to check if it already returns individual sale dates or just aggregated totals. If aggregated, I will add a `daysWithSales` count to the hook's return value by querying distinct sale dates from the same data source.

### Changes summary

1. **`useAggregateSales` hook** -- add a `daysWithSales` field that counts distinct `sale_date` values within the range from the already-queried sales data.
2. **`AggregateSalesCard.tsx`** -- replace `differenceInCalendarDays` with the `daysWithSales` value from the hook. Update the tooltip text.
