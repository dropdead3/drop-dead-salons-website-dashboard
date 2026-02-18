

## Enhance Service Category Mix Table with New Columns

### What Changes

Add three new data columns to the existing Service Category Mix table (the donut + table card):

| Column | Description | Data Source |
|---|---|---|
| **Avg Rev/Hr** | Average revenue per hour of chair time for the category | Computed from service durations already in `useServiceEfficiency` data |
| **% Rev** | Percentage of total revenue (already exists as the `%` column -- will be relabeled for clarity) |  Already computed as `cat.pct` |
| **% Booked** | Percentage of total bookings this category represents | `cat.count / totalBookings * 100` |

### Current Table Columns
`Category | Revenue | Count | % | Avg Ticket`

### New Table Columns
`Category | Revenue | Avg Rev/Hr | Count | % Rev | % Booked | Avg Ticket`

### Technical Details

**Modified: `src/components/dashboard/analytics/ServicesContent.tsx`**

1. **Extend `categoryMix` memo** -- compute `totalDurationMin` per category by summing `s.bookings * s.avgDuration` for each service in the category, then derive `revPerHour = revenue / (totalDurationMin / 60)`

2. **Compute `totalBookings`** -- sum all category counts to calculate each category's booking share percentage

3. **Add table columns:**
   - `Avg Rev/Hr` column after Revenue -- displays `formatCurrency(cat.revPerHour)` with `/hr` suffix
   - Rename existing `%` header to `% Rev` for clarity
   - Add `% Booked` column showing `Math.round(cat.count / totalBookings * 100)%`

4. **Update drill-down `colSpan`** from 5 to 7 to account for the two new columns

No new components or hooks needed. All data is already available from the existing `useServiceEfficiency` hook that powers this section.
