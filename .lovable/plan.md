

## Add Actual vs Expected Status to Location Line Items (Today Filter)

### Overview
When the "By Location" table is shown with the "Today" filter active, each location row will indicate whether all transactions are checked out or how much revenue is still expected. This gives managers instant per-location visibility into checkout progress without clicking into each location.

### What Changes

**1. Expand `useTodayActualRevenue` hook** (`src/hooks/useTodayActualRevenue.ts`)
- Add a new query that fetches actual revenue **grouped by location_id** from `phorest_daily_sales_summary` for today
- Add a new query that fetches the last appointment end time **per location** from `phorest_appointments` for today
- Return a new `byLocation` map: `Record<string, { actualRevenue, lastEndTime, hasActualData }>`
- Only fires when `enabled` is true (i.e., dateRange is "today")

**2. Update the "By Location" table** (`src/components/dashboard/AggregateSalesCard.tsx`)
- When `dateRange === 'today'`, add a new **Status** column to the table
- For each location row, compare `actualRevenue` (checked out) vs `expectedRevenue` (from scheduled appointments):
  - **All done**: Show a subtle "Checked out" badge with a check icon when actual >= expected (or all appointments are past)
  - **In progress**: Show "X of Y checked out" with a mini progress indicator when some revenue is still pending
  - **Not started**: Show "Pending" in muted text when no actual revenue exists yet
- Below the status, show the last appointment end time for that location (e.g., "Last appt: 7:45 PM")

### Visual Design (Today filter only)

```text
| Location       | Revenue | ... | Status                          |
|----------------|---------|-----|---------------------------------|
| North Mesa     | $1,146  | ... | $420 of $1,146 checked out      |
|                |         |     | Last appt: 6:30 PM              |
| Val Vista Lakes| $875    | ... | Checked out [checkmark]         |
```

- The Status column only appears when dateRange is "today"
- Uses existing muted/primary color palette
- Check icon uses `text-primary`, progress text uses `text-muted-foreground`

### What Stays the Same
- For all other date ranges (yesterday, 7d, 30d, etc.), the table looks exactly as it does now -- no Status column
- The aggregate actual vs expected section at the top of the card remains unchanged
- Sorting, trend sparklines, and click-to-filter behavior are unaffected

### Technical Details

**Hook changes** (`useTodayActualRevenue.ts`):
- New query: `SELECT location_id, SUM(total_revenue), SUM(service_revenue), SUM(product_revenue), SUM(total_transactions) FROM phorest_daily_sales_summary WHERE summary_date = today GROUP BY location_id`
- New query: `SELECT location_id, MAX(end_time) FROM phorest_appointments WHERE appointment_date = today AND status NOT IN ('cancelled','no_show') GROUP BY location_id`
- Returns `locationActuals: Record<string, { actualRevenue, actualServiceRevenue, actualProductRevenue, actualTransactions, lastEndTime }>`

**Component changes** (`AggregateSalesCard.tsx`):
- Conditionally render the Status `TableHead` and `TableCell` only when `isToday` is true
- Look up each location's actual data from the hook's `locationActuals` map using `location.location_id`
- Format end times from `HH:MM:SS` to `h:mm A` using date-fns `parse`/`format`
- No new components needed -- inline rendering in the existing table structure

### Files Modified
1. `src/hooks/useTodayActualRevenue.ts` -- add per-location actual revenue and last appointment queries
2. `src/components/dashboard/AggregateSalesCard.tsx` -- add conditional Status column to location table

