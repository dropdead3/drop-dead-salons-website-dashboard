

## Add Zura AI Hover-Reveal to Command Center Pinned Cards

### Problem
When analytics cards are pinned to the **Command Center** (main dashboard), they render without the Zura AI insight button. In the **Analytics Hub**, every card is wrapped with `PinnableCard`, which provides the hover-reveal row containing both the Zura AI analysis button and the pin toggle. But in `CommandCenterAnalytics.tsx`, cards are rendered directly without this wrapper.

### Solution
Wrap each card rendered by the `renderCard()` function in `CommandCenterAnalytics.tsx` with the existing `PinnableCard` component. This is a single-file change.

### What Changes

**File: `src/components/dashboard/CommandCenterAnalytics.tsx`**

1. Import `PinnableCard`
2. In the `renderCard` function, wrap each card's output with `PinnableCard`, passing the appropriate `elementKey`, `elementName`, and `category="Command Center"`

Example of the pattern change per card:

```text
// Before
case 'sales_overview':
  return (
    <VisibilityGate key={cardId} elementKey="sales_overview">
      <AggregateSalesCard ... />
    </VisibilityGate>
  );

// After
case 'sales_overview':
  return (
    <VisibilityGate key={cardId} elementKey="sales_overview">
      <PinnableCard elementKey="sales_overview" elementName="Sales Overview" category="Command Center">
        <AggregateSalesCard ... />
      </PinnableCard>
    </VisibilityGate>
  );
```

This applies to all 11 cards in the switch statement: `sales_overview`, `top_performers`, `revenue_breakdown`, `client_funnel`, `team_goals`, `new_bookings`, `week_ahead_forecast`, `capacity_utilization`, `hiring_capacity`, `staffing_trends`, `stylist_workload`.

### Result
Every pinned card on the Command Center will show the same hover-reveal row with the Zura AI analysis button and pin toggle, matching the Analytics Hub experience exactly. No database changes needed.
