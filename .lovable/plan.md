
# Add "Pin to Command Center" Toggles Directly on Cards

## Current State

The visibility toggles are currently located in the **tab headers** (e.g., SalesTabContent.tsx lines 141-148). This means Super Admins need to look at the top of the page to find and toggle card visibility.

## Goal

Move the toggles directly **onto each card's header**, making them contextually relevant and easier to discover. The gear icon will appear next to the card title.

## Cards to Update

| Card Component | Element Key | File |
|---------------|-------------|------|
| `ForecastingCard` | `week_ahead_forecast` | `src/components/dashboard/sales/ForecastingCard.tsx` |
| `CapacityUtilizationCard` | `capacity_utilization` | `src/components/dashboard/sales/CapacityUtilizationCard.tsx` |
| `NewBookingsCard` | `new_bookings` | `src/components/dashboard/NewBookingsCard.tsx` |
| `AggregateSalesCard` | `sales_overview` | `src/components/dashboard/AggregateSalesCard.tsx` |
| `WebsiteAnalyticsWidget` | `website_analytics` | `src/components/dashboard/WebsiteAnalyticsWidget.tsx` |
| `ClientEngineOverview` | `client_engine_overview` | `src/components/dashboard/ClientEngineOverview.tsx` |
| `OnboardingTrackerOverview` | `onboarding_overview` | `src/components/dashboard/OnboardingTrackerOverview.tsx` |
| `StaffOverviewCard` | `team_overview` | `src/components/dashboard/StylistsOverviewCard.tsx` |
| `StylistsOverviewCard` | `stylists_overview` | `src/components/dashboard/StylistsOverviewCard.tsx` |

## Implementation

### Phase 1: Add Toggles to Card Headers

For each card, add the `CommandCenterVisibilityToggle` component to the card header, next to the title.

**Example pattern (ForecastingCard header):**

```tsx
import { CommandCenterVisibilityToggle } from '@/components/dashboard/CommandCenterVisibilityToggle';

// In CardHeader:
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <CalendarRange className="w-5 h-5 text-primary" />
    <CardTitle className="font-display text-base">Forecasting</CardTitle>
    {/* Info button */}
    <CommandCenterVisibilityToggle 
      elementKey="week_ahead_forecast" 
      elementName="Forecasting" 
    />
  </div>
  {/* Location filter, etc. */}
</div>
```

### Phase 2: Remove Toggles from Tab Headers

After adding toggles to cards, remove the redundant toggles from:
- `SalesTabContent.tsx` (lines 141-148)
- `OperationsTabContent.tsx` (similar location)
- `MarketingTabContent.tsx`
- `ProgramTabContent.tsx`

This prevents duplicate toggles and clarifies where the toggle lives.

## Visual Layout

```text
┌──────────────────────────────────────────────────────────────┐
│  📊 Forecasting   ⓘ  ⚙   [Tomorrow▾]  [7 Days▾]  [Location▾]│
│  ──────────────────────────────────────────────────────────  │
│  │ Total │ Avg │ Appointments │                              │
│  └───────┴─────┴──────────────┘                              │
│  ▓▓▓ ▓▓▓▓ ▓▓ ▓▓▓▓▓  Bar Chart                               │
└──────────────────────────────────────────────────────────────┘
                  ↑
              Gear icon (⚙) opens popover with "Show on Command Center" toggle
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/sales/ForecastingCard.tsx` | Add toggle to header |
| `src/components/dashboard/sales/CapacityUtilizationCard.tsx` | Add toggle to header |
| `src/components/dashboard/NewBookingsCard.tsx` | Add toggle to header |
| `src/components/dashboard/AggregateSalesCard.tsx` | Add toggle to header |
| `src/components/dashboard/WebsiteAnalyticsWidget.tsx` | Add toggle to header |
| `src/components/dashboard/ClientEngineOverview.tsx` | Add toggle to header |
| `src/components/dashboard/OnboardingTrackerOverview.tsx` | Add toggle to header |
| `src/components/dashboard/StylistsOverviewCard.tsx` | Add toggle to both cards |
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Remove header toggles |
| `src/components/dashboard/analytics/OperationsTabContent.tsx` | Remove header toggles |
| `src/components/dashboard/analytics/MarketingTabContent.tsx` | Remove header toggle |
| `src/components/dashboard/analytics/ProgramTabContent.tsx` | Remove header toggle |

## User Experience

1. Super Admin opens Analytics Hub
2. Each card shows a gear icon (⚙) in its header
3. Clicking the gear opens a popover: "Show on Command Center" toggle
4. When toggled ON, the card appears on the Command Center dashboard
5. When toggled OFF, the card is hidden from Command Center

## Technical Notes

- Uses existing `CommandCenterVisibilityToggle` component (no changes needed)
- Toggle only visible to Super Admins (built into the component)
- Visibility state persists in `dashboard_element_visibility` table
- No database changes required
