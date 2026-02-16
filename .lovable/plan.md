
# Update All Revenue Bars to Show Share of Total

## Why This Matters
Across the platform, revenue progress bars divide by the top earner's value, making the leader always appear at 100%. This misrepresents contribution -- a provider earning half the total should show a 50% bar, not 75%.

## Files to Update

### 1. StylistSalesRow.tsx
- Rename prop from `maxRevenue` to `totalRevenue`
- Update bar width calculation from `stylist.totalRevenue / maxRevenue` to `stylist.totalRevenue / totalRevenue`

### 2. PhorestStaffRow.tsx
- Same change: rename prop `maxRevenue` to `totalRevenue`
- Update bar width calculation accordingly

### 3. SalesDashboard.tsx
- Change `maxStylistRevenue` to `totalStylistRevenue` using `.reduce((sum, s) => sum + s.totalRevenue, 0)` instead of `Math.max(...)`
- Change `maxPhorestStaffRevenue` to `totalPhorestStaffRevenue` using the same sum approach
- Pass as `totalRevenue` prop instead of `maxRevenue`

### 4. SalesTabContent.tsx
- Change `maxStylistRevenue` to `totalStylistRevenue` using `.reduce()` sum
- Pass as `totalRevenue` prop

### 5. ExecutiveSummaryCard.tsx
- Replace `const maxRevenue = locations[0]?.totalRevenue || 1` with `const totalRevenue = locations.reduce((sum, l) => sum + l.totalRevenue, 0) || 1`
- Update bar width to use `totalRevenue`

## What Stays Unchanged
- TicketDistributionPanel, TransactionsByHourPanel (histograms -- relative to max is correct)
- RevPerHourByStylistPanel (efficiency metric with salon average marker -- comparison is the intent)
- AssistantWorkloadChart, StylistWorkloadCard (workload distribution comparisons)
- CategoryComparisonTable (growth visualization, not revenue share)
- DayProviderBreakdownPanel (already fixed in previous change)
