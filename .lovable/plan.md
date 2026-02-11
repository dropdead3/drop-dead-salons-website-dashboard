

## Enhanced Sales Overview: Actual vs Expected Revenue for "Today"

### What This Does

When the Sales Overview card is filtered to "Today", it will:

1. Show **Expected Revenue** (from scheduled appointments) as the hero number -- same as now
2. Show **Actual Revenue** (from daily sales summary / checked-out transactions) alongside it when available
3. Display a contextual message: "Actual revenue updates as appointments check out"
4. Show the **estimated final transaction time** based on the last scheduled appointment's end time (e.g., "Last appointment ends at 7:45 PM")
5. As actual revenue accumulates through the day, show a progress-style comparison

### How It Works

**Data Sources:**
- **Expected Revenue**: Already fetched from `phorest_appointments` via `useSalesMetrics` -- no change needed
- **Actual Revenue**: Query `phorest_daily_sales_summary` for today's date (currently returns null/0 until Phorest syncs checked-out data)
- **Last Appointment Time**: Query `MAX(end_time)` from `phorest_appointments` for today

### Visual Design

When dateRange is "Today":

```text
+-------------------------------------------------+
|              $2,021                              |
|           Total Revenue                          |
|      [Clock] Expected Revenue  (i)               |
|                                                  |
|   Actual Revenue: $850 of $2,021 expected        |
|   [progress bar ~~~~~~~~~~~~-------]             |
|                                                  |
|   Last appointment ends at 7:45 PM               |
|   Actual revenue updates as appointments         |
|   check out                                      |
+-------------------------------------------------+
```

- If actual revenue is 0 or unavailable: show "Actual revenue not available until appointments check out"
- If actual > 0 but < expected: show progress bar and both amounts
- If all appointments are past current time: the "Expected" badge could shift to indicate the day is wrapping up

### Files to Change

**1. New Hook: `src/hooks/useTodayActualRevenue.ts`**
- Queries `phorest_daily_sales_summary` for today's date to get actual checked-out revenue
- Queries `phorest_appointments` for today's `MAX(end_time)` to get the last appointment end time
- Returns `{ actualRevenue, lastAppointmentEndTime, hasActualData }`

**2. Update: `src/components/dashboard/AggregateSalesCard.tsx`**
- Import and call the new hook when `dateRange === 'today'`
- Below the "Expected Revenue" badge, add a new section showing:
  - Actual revenue amount (or "not yet available" message)
  - A subtle progress indicator (actual / expected)
  - The estimated final transaction time formatted as "Last appointment ends at X:XX PM"
  - A muted helper text explaining the data flow

### Technical Details

- The new hook only fires when dateRange is "today" (`enabled: dateRange === 'today'`)
- `end_time` is stored as `HH:MM:SS` in the database -- will be formatted to 12-hour time for display
- The actual revenue query targets `phorest_daily_sales_summary` which aggregates checked-out/completed transaction data from Phorest syncs
- The progress bar uses `@radix-ui/react-progress` (already installed)
- Styling follows the existing luxury aesthetic: muted backgrounds, primary accent, editorial typography
- No database changes needed -- all data already exists in current tables

