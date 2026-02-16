## Booking Pipeline Health Indicator

### Problem

As a leader, you have no forward-looking signal for whether your appointment books are thinning out beyond the next week. A sudden scheduling die-down at the 3-6 week horizon means revenue will crater -- and by the time you notice in weekly numbers, it's too late to act. You need an early warning system.

### What We'll Build: "Booking Pipeline" KPI Tile

A new KPI tile inside the Executive Summary card (under the Operations section) that shows the health of your forward appointment pipeline across 14-42 days.

**What it shows:**

- A pipeline health label: "Healthy", "Slowing", or "Critical"
- Color-coded value (green/amber/red) based on how future bookings compare to your trailing average
- A subtitle showing the comparison: e.g., "32 appts next 14d vs 45 avg"
- Drills down to the Capacity/Utilization analytics tab for deeper analysis

**How it works:**

1. Count appointments booked for the next 14 days (forward pipeline)
2. Count appointments that were on the books for the trailing 14 days (recent baseline)
3. Compare: if forward is less than 50% of baseline, it's "Critical" (red). 50-80% is "Slowing" (amber). 80%+ is "Healthy" (green).

### Visual (inside Executive Summary, Operations row)

```text
OPERATIONS
|---------------------|---------------------|---------------------|---------------------|
| TOTAL STAFF         | TOTAL CLIENTS       | UTILIZATION         | BOOKING PIPELINE    |
| 2                   | 504                 | 3%                  | Slowing             |
| View Team >         | View Clients >      | View Capacity >     | 18 vs 28 avg (14d)  |
|                     |                     |                     | View Pipeline >     |
|---------------------|---------------------|---------------------|---------------------|
```

### Changes

**1. New hook: `src/hooks/useBookingPipeline.ts**`

- Queries `phorest_appointments` for the next 14 days (forward count)
- Queries `phorest_appointments` for the trailing 14 days (baseline count)
- Computes a ratio and returns health status, counts, and the percentage
- Accepts optional `locationId` filter
- Returns: `{ forwardCount, baselineCount, ratio, status: 'healthy' | 'slowing' | 'critical', label }`

**2. Update: `src/components/dashboard/analytics/ExecutiveSummaryCard.tsx**`

- Import and call `useBookingPipeline(locationId)`
- Add a 7th KPI tile to the Operations section:
  - Icon: `CalendarCheck2` (or `CalendarClock`)
  - Label: "Booking Pipeline"
  - Value: The health label ("Healthy" / "Slowing" / "Critical")
  - Value color: green for healthy, amber for slowing, red for critical
  - Subtitle: "X appts next 14d vs Y avg"
  - Drill-down link: `/dashboard/admin/analytics?tab=operations&subtab=staff-utilization`
  - Tooltip: "Compares appointments booked for the next 14 days against your trailing 14-day average. Flags slowdowns before they impact revenue."
- The Operations grid will now hold 4 items (renders cleanly in a `grid-cols-2 md:grid-cols-4` or keeps the existing `md:grid-cols-3` with the 4th wrapping gracefully)

### Thresholds


| Ratio (Forward / Baseline) | Status   | Color |
| -------------------------- | -------- | ----- |
| >= 90%                     | Healthy  | green |
| 70% - 89%                  | Slowing  | amber |
| < 70%                      | Critical | red   |


### Technical Details

`**useBookingPipeline.ts**`

```
- Forward query: appointment_date between tomorrow and +14 days, excluding cancelled/no_show
- Baseline query: appointment_date between -14 days and today, excluding cancelled/no_show
- Both respect locationId filter
- Returns { forwardCount, baselineCount, ratio, status, label }
- staleTime: 10 minutes
```

**Grid layout adjustment:**

- Operations section currently has 3 tiles (Staff, Clients, Utilization)
- Adding a 4th keeps `md:grid-cols-3` with the 4th item wrapping to next row on medium screens, or we can switch to `grid-cols-2 md:grid-cols-4` for a balanced row

### Files

- **Create**: `src/hooks/useBookingPipeline.ts`
- **Modify**: `src/components/dashboard/analytics/ExecutiveSummaryCard.tsx`