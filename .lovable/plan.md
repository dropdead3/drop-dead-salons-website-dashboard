
# Move Remaining Command Center Cards to Analytics Hub

## Current State Analysis

The Command Center (`DashboardHome.tsx`) still contains these leadership-only widgets that should be moved to the Analytics Hub:

| Widget | Current Location (Line) | Target Analytics Hub Tab | Element Key |
|--------|------------------------|-------------------------|-------------|
| `WebsiteAnalyticsWidget` | Lines 441-446 | Marketing | `website_analytics` |
| `ClientEngineOverview` | Lines 450-452 | Program | `client_engine_overview` |
| `OnboardingTrackerOverview` | Lines 453-455 | Operations > Staffing | `onboarding_overview` |
| `StaffOverviewCard` (Team Overview) | Lines 462-464 | Operations > Staffing | `team_overview` |
| `StylistsOverviewCard` | Lines 465-467 | Operations > Staffing | `stylists_overview` |

## Implementation Plan

### Phase 1: Update Analytics Hub Tabs with New Content

#### 1.1 Marketing Tab - Add Website Analytics

**File: `src/components/dashboard/analytics/MarketingTabContent.tsx`**

Add the `WebsiteAnalyticsWidget` at the top of the Marketing tab, above the KPI cards. The visibility toggle already exists (line 60-63).

```tsx
import { WebsiteAnalyticsWidget } from '@/components/dashboard/WebsiteAnalyticsWidget';

// Add below header controls, before KPI cards:
<WebsiteAnalyticsWidget />
```

#### 1.2 Program Tab - Add Client Engine Overview

**File: `src/components/dashboard/analytics/ProgramTabContent.tsx`**

Add the `ClientEngineOverview` as a summary card and add a visibility toggle in the header.

```tsx
import { ClientEngineOverview } from '@/components/dashboard/ClientEngineOverview';
import { CommandCenterVisibilityToggle } from '@/components/dashboard/CommandCenterVisibilityToggle';

// Add to header area:
<CommandCenterVisibilityToggle 
  elementKey="client_engine_overview" 
  elementName="Client Engine Overview" 
/>

// Add ClientEngineOverview as a full-width card at the top of the content
```

#### 1.3 Operations Tab > Staffing - Add Team Cards

**File: `src/components/dashboard/analytics/StaffingContent.tsx`**

Add `StaffOverviewCard`, `StylistsOverviewCard`, and `OnboardingTrackerOverview` to the Staffing sub-tab.

```tsx
import { StaffOverviewCard, StylistsOverviewCard } from '@/components/dashboard/StylistsOverviewCard';
import { OnboardingTrackerOverview } from '@/components/dashboard/OnboardingTrackerOverview';

// Add as a 2-column grid section:
<div className="grid lg:grid-cols-2 gap-6 mb-6">
  <StaffOverviewCard />
  <StylistsOverviewCard />
</div>

<OnboardingTrackerOverview />
```

#### 1.4 Operations Tab Header - Add Visibility Toggles

**File: `src/components/dashboard/analytics/OperationsTabContent.tsx`**

Add visibility toggles for the new elements.

```tsx
<CommandCenterVisibilityToggle 
  elementKey="team_overview" 
  elementName="Team Overview" 
/>
<CommandCenterVisibilityToggle 
  elementKey="stylists_overview" 
  elementName="Stylists by Level" 
/>
<CommandCenterVisibilityToggle 
  elementKey="onboarding_overview" 
  elementName="Onboarding Overview" 
/>
```

### Phase 2: Update Command Center Analytics Component

**File: `src/components/dashboard/CommandCenterAnalytics.tsx`**

Add the new elements to the pinned analytics section, so they render when visibility is enabled.

```tsx
import { WebsiteAnalyticsWidget } from '@/components/dashboard/WebsiteAnalyticsWidget';
import { ClientEngineOverview } from '@/components/dashboard/ClientEngineOverview';
import { OnboardingTrackerOverview } from '@/components/dashboard/OnboardingTrackerOverview';
import { StaffOverviewCard, StylistsOverviewCard } from '@/components/dashboard/StylistsOverviewCard';

// Add visibility checks:
const hasClientEngineOverview = isElementVisible('client_engine_overview');
const hasOnboardingOverview = isElementVisible('onboarding_overview');
const hasTeamOverview = isElementVisible('team_overview');
const hasStylistsOverview = isElementVisible('stylists_overview');

// Update hasAnyPinned check to include all elements

// Render conditionally:
{hasClientEngineOverview && (
  <VisibilityGate elementKey="client_engine_overview">
    <ClientEngineOverview />
  </VisibilityGate>
)}
// ... same pattern for other widgets
```

### Phase 3: Remove Elements from Command Center

**File: `src/pages/dashboard/DashboardHome.tsx`**

Remove the following sections (they will now be rendered via `CommandCenterAnalytics` when pinned):

1. **Lines 441-446**: Remove standalone `WebsiteAnalyticsWidget` (already in CommandCenterAnalytics)
2. **Lines 448-457**: Remove `ClientEngineOverview` and `OnboardingTrackerOverview` grid
3. **Lines 459-469**: Remove `StaffOverviewCard` and `StylistsOverviewCard` grid

Also remove unused imports:
- `WebsiteAnalyticsWidget` (line 43)
- `OnboardingTrackerOverview` (line 44)
- `ClientEngineOverview` (line 45)
- `StylistsOverviewCard`, `StaffOverviewCard` (line 38)

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/analytics/MarketingTabContent.tsx` | Add `WebsiteAnalyticsWidget` at top |
| `src/components/dashboard/analytics/ProgramTabContent.tsx` | Add `ClientEngineOverview` + visibility toggle |
| `src/components/dashboard/analytics/StaffingContent.tsx` | Add team overview cards + onboarding |
| `src/components/dashboard/analytics/OperationsTabContent.tsx` | Add visibility toggles for new elements |
| `src/components/dashboard/CommandCenterAnalytics.tsx` | Add all new pinnable cards |
| `src/pages/dashboard/DashboardHome.tsx` | Remove standalone widgets, clean up imports |

## Data Flow Diagram

```text
Analytics Hub (Source of Truth)
├── Sales Tab
│   ├── Sales KPIs ──────────[⚙ Pin]──► Command Center
│   └── Forecasting ─────────[⚙ Pin]──► Command Center
│
├── Operations Tab
│   ├── Appointments
│   │   └── New Bookings ────[⚙ Pin]──► Command Center
│   ├── Capacity ────────────[⚙ Pin]──► Command Center
│   └── Staffing
│       ├── Team Overview ───[⚙ Pin]──► Command Center
│       ├── Stylists by Level [⚙ Pin]──► Command Center
│       └── Onboarding ──────[⚙ Pin]──► Command Center
│
├── Marketing Tab
│   └── Website Traffic ─────[⚙ Pin]──► Command Center
│
└── Program Tab
    └── Client Engine ───────[⚙ Pin]──► Command Center
```

## User Experience

1. **Default State**: Command Center shows empty analytics section with helpful link to Analytics Hub
2. **Customization**: Super Admins navigate to any Analytics Hub tab and click the gear icon (⚙) on cards they want to pin
3. **Result**: Pinned cards appear on Command Center for all leadership roles
4. **Flexibility**: Each card can be independently toggled on/off

## Technical Notes

- All visibility toggles use the existing `CommandCenterVisibilityToggle` component
- All conditional rendering uses the existing `VisibilityGate` component
- The `dashboard_element_visibility` table already supports this pattern
- No database changes required
- Element keys follow existing naming conventions (snake_case)
