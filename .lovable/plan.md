
# Hide Sales Overview and Forecasting Cards from Manager Role on Command Center

## Overview

Ensure that when the Manager role has Sales visibility turned off, the Sales Overview card and Forecasting (Revenue Forecast) card on the Command Center dashboard are also hidden.

---

## Current Issue

The visibility system has **separate controls** for:
1. **Analytics Hub tabs** (e.g., `analytics_sales_tab`) - Controls access to the full analytics page
2. **Command Center pinned cards** (e.g., `sales_overview`, `week_ahead_forecast`) - Controls which cards appear on the dashboard home

Currently:
- `analytics_sales_tab` is **OFF** for Manager ✅
- `sales_overview` is **ON** for Manager ❌
- `week_ahead_forecast` is **ON** for Manager ❌
- `revenue_forecast` is **ON** for Manager ❌

This means Managers can still see sales revenue data on the Command Center even though the Analytics Sales tab is hidden.

---

## Solution

Enhance the pinned analytics cards on the Command Center to respect **both** the card-level visibility AND the parent tab visibility. If a user cannot access the Sales tab, they should also not see sales-related cards on the Command Center.

### Changes to PinnedAnalyticsCard.tsx

**File: `src/components/dashboard/PinnedAnalyticsCard.tsx`**

Add a secondary visibility check - if the parent analytics tab is hidden, also hide the related pinned cards:

| Card ID | Parent Tab Key | Description |
|---------|----------------|-------------|
| `sales_overview` | `analytics_sales_tab` | Sales Overview |
| `top_performers` | `analytics_sales_tab` | Top Performers |
| `revenue_breakdown` | `analytics_sales_tab` | Revenue Breakdown |
| `team_goals` | `analytics_sales_tab` | Team Goals |
| `week_ahead_forecast` | `analytics_sales_tab` | Forecasting Card |
| `capacity_utilization` | `analytics_operations_tab` | Capacity Utilization |
| `operations_stats` | `analytics_operations_tab` | Operations Stats |

```tsx
// Define parent tab relationships
const CARD_TO_TAB_MAP: Record<string, string> = {
  'sales_overview': 'analytics_sales_tab',
  'top_performers': 'analytics_sales_tab',
  'revenue_breakdown': 'analytics_sales_tab',
  'team_goals': 'analytics_sales_tab',
  'week_ahead_forecast': 'analytics_sales_tab',
  'capacity_utilization': 'analytics_operations_tab',
  'operations_stats': 'analytics_operations_tab',
  // ... etc
};

export function PinnedAnalyticsCard({ cardId, filters }: PinnedAnalyticsCardProps) {
  // Check parent tab visibility
  const parentTabKey = CARD_TO_TAB_MAP[cardId];
  const parentTabVisible = useElementVisibility(parentTabKey || '');
  
  // If parent tab is hidden and we have a mapping, don't render
  if (parentTabKey && !parentTabVisible) {
    return null;
  }
  
  // ... rest of component
}
```

---

## Alternative: UI-Based Fix

If you prefer not to change code, the Manager role's visibility can be updated directly in the Role Access Configurator:

1. Go to **Settings > Access & Visibility > Role Access**
2. Select **Manager** role
3. Click the **Widgets** tab
4. Find and toggle **OFF** these elements:
   - Under "Sales" category: **Sales Overview**
   - Under "Leadership Widgets" category: **Forecasting**
   - Under "Analytics Hub - Sales" category: **Revenue Forecast**

This approach requires manual configuration but gives full control over each element independently.

---

## Recommended Approach

Implement the code-based solution because:
1. It creates a logical relationship - if you can't access the Sales tab, you shouldn't see sales cards on the Command Center
2. It reduces admin configuration burden
3. It prevents accidental exposure of restricted data

---

## File Summary

| File | Action |
|------|--------|
| `src/components/dashboard/PinnedAnalyticsCard.tsx` | Add parent tab visibility check |

---

## Result

When the Manager role has `analytics_sales_tab` set to hidden:
- ✅ Sales tab in Analytics Hub is hidden
- ✅ Sales Overview card on Command Center is automatically hidden
- ✅ Forecasting card on Command Center is automatically hidden
- ✅ Revenue Breakdown card on Command Center is automatically hidden

Managers will only see Command Center cards for analytics sections they have access to.
