

# Full Command Center Customization System

## Overview

This plan establishes the Command Center as a **fully customizable dashboard** where users can pin any analytics element from the Analytics Hub. All unique dashboard elements will be moved to their respective tabs in the Analytics Hub, and every analytics card will have a "Pin to Command Center" toggle.

## Current State Analysis

### Already Implemented (Phase 1 Complete)
These cards already have the visibility toggle and can be pinned:
| Card | Element Key | Location |
|------|-------------|----------|
| `AggregateSalesCard` | `sales_overview` | Sales Tab |
| `ForecastingCard` | `week_ahead_forecast` | Sales > Forecasting |
| `NewBookingsCard` | `new_bookings` | Operations > Appointments |
| `CapacityUtilizationCard` | `capacity_utilization` | Operations > Appointments |
| `WebsiteAnalyticsWidget` | `website_analytics` | Marketing Tab |
| `ClientEngineOverview` | `client_engine_overview` | Program Tab |
| `OnboardingTrackerOverview` | `onboarding_overview` | Operations > Staffing |
| `StaffOverviewCard` | `team_overview` | Operations > Staffing |
| `StylistsOverviewCard` | `stylists_overview` | Operations > Staffing |

### Elements Requiring Pinning Support

#### Sales Tab - Additional Cards
| Card | Suggested Element Key | Description |
|------|----------------------|-------------|
| `TopPerformersCard` | `top_performers` | Staff leaderboard by revenue |
| `RevenueDonutChart` | `revenue_breakdown` | Service vs Product split |
| `ClientFunnelCard` | `client_funnel` | New vs Returning revenue |
| `RevenueForecast` | `revenue_forecast` | Month-end projection |
| `TeamGoalsCard` | `team_goals` | Goal progress tracking |

#### Operations Tab - Additional Cards
| Card | Suggested Element Key | Description |
|------|----------------------|-------------|
| `HiringCapacityCard` | `hiring_capacity` | Headcount vs targets |
| `StaffingTrendChart` | `staffing_trends` | Staff count over time |
| `StylistWorkloadCard` | `stylist_workload` | Workload distribution |

#### Program Tab - Additional Cards
| Card | Suggested Element Key | Description |
|------|----------------------|-------------|
| `ProgramCompletionFunnel` | `program_funnel` | Enrollment funnel |

## Implementation Plan

### Phase 1: Add Toggles to Sales Tab Cards

**Files to modify:**
- `src/components/dashboard/sales/TopPerformersCard.tsx`
- `src/components/dashboard/sales/RevenueDonutChart.tsx`
- `src/components/dashboard/sales/ClientFunnelCard.tsx`
- `src/components/dashboard/sales/RevenueForecast.tsx`
- `src/components/dashboard/sales/TeamGoalsCard.tsx`

For each card, add the toggle to the CardHeader:
```tsx
import { CommandCenterVisibilityToggle } from '@/components/dashboard/CommandCenterVisibilityToggle';

// In CardHeader, add after title:
<CommandCenterVisibilityToggle 
  elementKey="[element_key]" 
  elementName="[Display Name]" 
/>
```

### Phase 2: Add Toggles to Operations Tab Cards

**Files to modify:**
- `src/components/dashboard/HiringCapacityCard.tsx`
- `src/components/dashboard/StaffingTrendChart.tsx`
- `src/components/dashboard/StylistWorkloadCard.tsx`

Same pattern: add `CommandCenterVisibilityToggle` to each card header.

### Phase 3: Update CommandCenterAnalytics Component

**File: `src/components/dashboard/CommandCenterAnalytics.tsx`**

Add imports and visibility checks for all new pinnable cards:

```tsx
// New imports
import { TopPerformersCard } from '@/components/dashboard/sales/TopPerformersCard';
import { RevenueDonutChart } from '@/components/dashboard/sales/RevenueDonutChart';
import { ClientFunnelCard } from '@/components/dashboard/sales/ClientFunnelCard';
import { RevenueForecast } from '@/components/dashboard/sales/RevenueForecast';
import { TeamGoalsCard } from '@/components/dashboard/sales/TeamGoalsCard';
import { HiringCapacityCard } from '@/components/dashboard/HiringCapacityCard';
import { StaffingTrendChart } from '@/components/dashboard/StaffingTrendChart';
import { StylistWorkloadCard } from '@/components/dashboard/StylistWorkloadCard';

// Add visibility checks
const hasTopPerformers = isElementVisible('top_performers');
const hasRevenueBreakdown = isElementVisible('revenue_breakdown');
const hasClientFunnel = isElementVisible('client_funnel');
const hasRevenueForecast = isElementVisible('revenue_forecast');
const hasTeamGoals = isElementVisible('team_goals');
const hasHiringCapacity = isElementVisible('hiring_capacity');
const hasStaffingTrends = isElementVisible('staffing_trends');
const hasStylistWorkload = isElementVisible('stylist_workload');

// Update hasAnyPinned to include all
const hasAnyPinned = hasSalesOverview || hasNewBookings || ... || hasTopPerformers || ...;

// Render conditionally
{hasTopPerformers && (
  <VisibilityGate elementKey="top_performers">
    <TopPerformersCard />
  </VisibilityGate>
)}
// ... repeat for all new cards
```

### Phase 4: Organize Command Center Layout

Group pinned cards by category for a clean layout:

```text
Command Center (Pinned Analytics)
├── Sales Section
│   ├── Sales Overview (sales_overview)
│   ├── Top Performers (top_performers)
│   ├── Revenue Breakdown (revenue_breakdown)
│   ├── Client Funnel (client_funnel)
│   └── Team Goals (team_goals)
│
├── Forecasting Section
│   ├── Week Ahead Forecast (week_ahead_forecast)
│   └── Revenue Forecast (revenue_forecast)
│
├── Operations Section
│   ├── New Bookings (new_bookings)
│   ├── Capacity Utilization (capacity_utilization)
│   ├── Hiring Capacity (hiring_capacity)
│   └── Staffing Trends (staffing_trends)
│
├── Team Section
│   ├── Team Overview (team_overview)
│   ├── Stylists by Level (stylists_overview)
│   ├── Stylist Workload (stylist_workload)
│   └── Onboarding (onboarding_overview)
│
├── Marketing Section
│   └── Website Analytics (website_analytics)
│
└── Program Section
    └── Client Engine (client_engine_overview)
```

## Files to Modify Summary

| File | Changes |
|------|---------|
| `src/components/dashboard/sales/TopPerformersCard.tsx` | Add toggle |
| `src/components/dashboard/sales/RevenueDonutChart.tsx` | Add toggle |
| `src/components/dashboard/sales/ClientFunnelCard.tsx` | Add toggle |
| `src/components/dashboard/sales/RevenueForecast.tsx` | Add toggle |
| `src/components/dashboard/sales/TeamGoalsCard.tsx` | Add toggle |
| `src/components/dashboard/HiringCapacityCard.tsx` | Add toggle |
| `src/components/dashboard/StaffingTrendChart.tsx` | Add toggle |
| `src/components/dashboard/StylistWorkloadCard.tsx` | Add toggle |
| `src/components/dashboard/CommandCenterAnalytics.tsx` | Add all new cards |

## User Experience Flow

```text
1. User navigates to Analytics Hub
2. Sees card with data they want on Command Center
3. Clicks gear icon (⚙) on that card's header
4. Toggles "Show on Command Center" ON
5. Card now appears on their Command Center dashboard
6. Can toggle OFF anytime to remove from Command Center
```

## Technical Details

- **Visibility System**: Uses existing `dashboard_element_visibility` table
- **Toggle Component**: Uses existing `CommandCenterVisibilityToggle` (only visible to Super Admins)
- **Rendering**: Uses existing `VisibilityGate` component for conditional rendering
- **No Database Changes**: All infrastructure is already in place
- **Role-Based**: Pinned cards respect role-based visibility rules

## Benefits

1. **Full Control**: Leadership can fully customize their Command Center
2. **Contextual**: Toggles are right on the cards, easy to discover
3. **Centralized Data**: Analytics Hub is the single source of truth
4. **Flexible**: Any combination of cards can be pinned
5. **Clean Default**: Empty Command Center shows helpful guidance to Analytics Hub

