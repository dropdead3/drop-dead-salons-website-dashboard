

## Fix: Use Service Name Pattern Matching for Forecast Category Breakdown

### Root Cause
The `service_category` column in `phorest_appointments` is NULL for these appointments. Other analytics (Capacity Utilization, Tips, Avg Ticket) already handle this by calling `getServiceCategory(apt.service_name)` from the pattern-matching utility, which derives the category from the service name (e.g., "Balayage" maps to "Blonding"). The two forecast hooks skip this step and fall back to "Uncategorized."

### Changes

**`src/hooks/useForecastRevenue.ts`**
- Import `getServiceCategory` from `@/utils/serviceCategorization`
- Line ~158: Change `const category = (apt as any).service_category || 'Uncategorized'` to `const category = (apt as any).service_category || getServiceCategory(apt.service_name)`
- Line ~179: Same change for the top-level `byCategory` aggregation

**`src/hooks/useWeekAheadRevenue.ts`**
- Import `getServiceCategory` from `@/utils/serviceCategorization`
- Line ~109 (per-day category breakdown): Change `const category = (apt as any).service_category || 'Uncategorized'` to `const category = (apt as any).service_category || getServiceCategory(apt.service_name)`
- Line ~122 (top-level byCategory aggregation): Same change

This matches the exact pattern already used in `useCapacityUtilization`, `useTipsDrilldown`, `useAvgTicketByStylist`, and `useRevenueByCategoryDrilldown`.

### Result
Forecast bars will show stacked segments for Color, Blonding, Haircut, Extensions, etc. -- using the same categorization logic and admin-configured colors as the Service Mix donut chart.

