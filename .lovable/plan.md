

## Make Simplified Cards Dynamic to Date Range Filter

### Problem
Several simplified (compact) card labels are hardcoded with time references like "today" or vague "this period" language, regardless of what date range the user has actually selected in the filter bar. This creates confusion when viewing data for "Last 7 days" but the card says "so far today."

### Approach
Add a small helper function that converts the active `DateRangeType` into a human-readable period phrase, then thread that phrase into every card's `metricLabel` so the context always matches the selected filter.

### Date Range Label Map

| Filter Value     | Label Phrase                  |
|------------------|-------------------------------|
| today            | today                         |
| yesterday        | yesterday                     |
| 7d               | the last 7 days               |
| 30d              | the last 30 days              |
| thisWeek         | this week                     |
| thisMonth        | this month                    |
| todayToEom       | today through end of month    |
| todayToPayday    | today through next pay day    |
| lastMonth        | last month                    |

### Cards Updated (all in `PinnedAnalyticsCard.tsx`)

1. **Sales Overview / Executive Summary**
   - Before: `"Total revenue across all services and retail"`
   - After: `"Total revenue across all services and retail for {period}"`

2. **Daily Brief**
   - Before: `"Revenue earned so far today"` (always says today)
   - After: `"Revenue earned {period}"` -- e.g. "Revenue earned this week"

3. **Top Performers**
   - Before: `"Highest earning team member this period"`
   - After: `"Highest earning team member {period}"`

4. **Revenue Breakdown**
   - Before: `"Service revenue vs. retail product revenue"`
   - After: `"Service vs. retail revenue for {period}"`

5. **Team Goals**
   - Before: `"Combined team revenue toward goal"`
   - After: `"Combined team revenue toward goal ({period})"`

6. **Client Funnel**
   - Before: `"New and returning clients this period"`
   - After: `"New and returning clients {period}"`

7. **New Bookings**
   - Before: `"Appointments added to the schedule so far today"`
   - After: `"Appointments added to the schedule {period}"`

8. **Service Mix**
   - Before: `"Highest revenue service category"`
   - After: `"Top service category by revenue ({period})"`

9. **Rebooking**
   - Before: `"Clients who rebooked before leaving"`
   - After: `"Clients who rebooked before leaving ({period})"`

10. **Retail Effectiveness**
    - Before: `"Percentage of service tickets with retail add-ons"`
    - After: `"Retail attachment rate for {period}"`

### Cards NOT Changed (static/independent of date filter)
- **Week Ahead Forecast** -- always next 7 days, independent of filter
- **Hiring Capacity** -- structural, not time-bound
- **Staffing Trends** -- headcount, not period-scoped
- **Stylist Workload** -- utilization snapshot
- **Operations Stats** -- live queue, always "now"
- **Operational Health** -- monitoring status
- **Locations Rollup** -- structural count
- **Client Health** -- segment counts, not period-filtered

### Technical Detail

**Single file changed:** `src/components/dashboard/PinnedAnalyticsCard.tsx`

A helper function `getPeriodLabel(dateRange: DateRangeType): string` will be added near the top of the file, returning the friendly phrase. Then each `metricLabel` assignment in the compact `switch` block will interpolate the result. Approximately 10-12 lines of label strings change; no data-fetching or hook logic is modified.

