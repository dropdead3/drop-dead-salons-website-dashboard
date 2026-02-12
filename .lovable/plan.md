
# Fix Weekly/Monthly Goal Revenue Tracking

## Problem
The Weekly Goal progress bar shows revenue from the selected date range filter (e.g., "Last 7 Days" or "Last 30 Days") instead of the actual current week or month. The pace indicator correctly calculates elapsed time for the current week/month, but the revenue number is wrong because it comes from the filtered `displayMetrics.totalRevenue`.

Example: If "Last 7 Days" is selected and covers Wed-to-Wed, the Weekly Goal shows 7 days of cross-week revenue but calculates pace against a Mon-to-Sun week structure.

## Solution
Decouple the goal revenue from the date range filter. The goal progress component will always use revenue from the correct goal period:
- **Weekly Goal**: Revenue from Monday of this week through today
- **Monthly Goal**: Revenue from 1st of this month through today
- **Yearly Goal**: Revenue from Jan 1 through today

## Technical Changes

### 1. New hook: `src/hooks/useGoalPeriodRevenue.ts`
A lightweight hook that queries `phorest_daily_sales_summary` for the correct goal period date range, independent of the dashboard filter.
- Accepts `goalPeriod` ('weekly' | 'monthly' | 'yearly') and optional `locationId`
- Calculates the correct `dateFrom` using `startOfWeek(now, { weekStartsOn: 1 })`, `startOfMonth(now)`, or `startOfYear(now)`
- Returns the summed revenue for that period

### 2. Modify `src/components/dashboard/AggregateSalesCard.tsx`
- Import and call `useGoalPeriodRevenue` with the derived `goalPeriod` and location
- Pass the hook's revenue to `SalesGoalProgress` as `current` instead of `displayMetrics.totalRevenue`
- The goal period derivation already exists (line 758): `dateRange === 'thisWeek' || dateRange === '7d' ? 'weekly' : 'monthly'` -- extend this for yearly cases too

### 3. No changes to `SalesGoalProgress.tsx`
The component's pace calculation logic is already correct. It just needs to receive the right `current` value.

## Result
The goal progress bar will always reflect "How much have we earned this week/month/year?" regardless of whether the user is viewing "Today", "Last 7 Days", or "Last 30 Days" in the filter. The pace indicator will correctly compare current-period revenue against the elapsed fraction of that period.
