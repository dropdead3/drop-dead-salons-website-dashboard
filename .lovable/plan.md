

# Remove Main "Zura Insights" Button from Analytics Hub

## What's Changing
Remove the large "Zura Insights" expandable drawer button from the Analytics Hub header bar. The small per-card Zura "Z" icons on individual analytics cards stay exactly as they are.

## File Changed

### `src/pages/dashboard/admin/AnalyticsHub.tsx`
- Remove the `AIInsightsDrawer` import (line 34)
- Remove the wrapper `<div>` that renders `<AIInsightsDrawer />` in the header (lines 206-209)

**Note:** The `AIInsightsDrawer` component itself and the `useAIInsights` hook are kept in the codebase since they're also used on the Command Center dashboard (`DashboardHome.tsx`).

