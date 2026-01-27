
# Remove Analytics from Command Center & Add "Show on Command Center" Toggles

## Problem Analysis

The Command Center dashboard (`DashboardHome.tsx`) currently displays several analytics cards for leadership:

| Current Command Center Card | Element Key | Status |
|----------------------------|-------------|--------|
| AggregateSalesCard | `sales_overview` | To be removed (already consolidated in Analytics Hub Sales tab) |
| NewBookingsCard | `new_bookings` | To be moved to Operations tab |
| ForecastingCard | `week_ahead_forecast` | Already exists in Sales tab as `RevenueForecast` |
| CapacityUtilizationCard | `capacity_utilization` | Already exists in Operations tab |

**Goal:** Make the Analytics Hub the primary source for all analytics, with each card having a "Show on Command Center" toggle to let leadership customize their Command Center view.

## Architecture

```text
Analytics Hub (Primary Source)          Command Center (User-Customizable)
┌─────────────────────────────┐         ┌─────────────────────────────┐
│ Sales Tab                   │         │                             │
│  ├─ KPIs (Revenue, etc)     │ ──[✓]──►│ AggregateSalesCard          │
│  ├─ Top Performers          │         │                             │
│  └─ Forecasting             │ ──[✓]──►│ ForecastingCard             │
│                             │         │                             │
│ Operations Tab              │         │                             │
│  ├─ Overview                │         │                             │
│  ├─ Appointments            │         │                             │
│  │   └─ New Bookings        │ ──[✓]──►│ NewBookingsCard             │
│  ├─ Capacity Utilization    │ ──[✓]──►│ CapacityUtilizationCard     │
│  └─ Staffing                │         │                             │
│                             │         │                             │
│ Marketing Tab               │         │                             │
│  └─ Website Analytics       │ ──[✓]──►│ WebsiteAnalyticsWidget      │
└─────────────────────────────┘         └─────────────────────────────┘
                                         
[✓] = "Show on Command Center" toggle
```

## Implementation Plan

### Phase 1: Remove Analytics Cards from Command Center

**File: `src/pages/dashboard/DashboardHome.tsx`**

Remove these sections from the leadership area:
1. `AggregateSalesCard` (lines 246-251)
2. `NewBookingsCard` (lines 253-258)
3. `ForecastingCard` (lines 260-265)
4. `CapacityUtilizationCard` (lines 267-272)

Also remove their imports (lines 47-50).

### Phase 2: Add "Show on Command Center" Toggles to Analytics Hub Cards

For each major section in the Analytics Hub, add a visibility toggle that allows Super Admins to opt-in cards to appear on Command Center.

**Files to Modify:**

| File | Add Toggle For |
|------|----------------|
| `SalesTabContent.tsx` | Sales KPIs card, Forecasting section |
| `OperationsTabContent.tsx` | New Bookings, Capacity Utilization |
| `MarketingTabContent.tsx` | Website Analytics (if leadership has access) |

### Phase 3: Create Command Center Analytics Section (Optional Pinned Cards)

Create a new section on Command Center that renders only the cards that have been "pinned" via visibility toggles. This uses the existing `VisibilityGate` system.

**New Component: `CommandCenterAnalytics.tsx`**

This component will:
1. Check `dashboard_element_visibility` for which elements are visible
2. Render only the pinned analytics cards
3. Show a subtle "No analytics pinned" message if none are enabled

### Phase 4: Add New Bookings to Operations Tab

The `NewBookingsCard` content needs to be integrated into the Operations > Appointments sub-tab.

**File: `src/components/dashboard/analytics/AppointmentsContent.tsx`**

Add New Bookings metrics at the top of the appointments view.

## Technical Implementation Details

### Toggle Component Enhancement

The existing `CommandCenterVisibilityToggle` component already handles the toggle logic. Each analytics section will include this toggle in its header.

```tsx
// Example usage in SalesTabContent.tsx
<div className="flex items-center gap-2">
  <CommandCenterVisibilityToggle 
    elementKey="sales_overview" 
    elementName="Sales Overview" 
  />
  <LastSyncIndicator syncType="sales" showAutoRefresh />
</div>
```

### Command Center Rendering

The Command Center will use `VisibilityGate` to conditionally render cards:

```tsx
// In DashboardHome.tsx - simplified analytics section
{isLeadership && (
  <div className="space-y-6">
    <VisibilityGate elementKey="sales_overview">
      <AggregateSalesCard />
    </VisibilityGate>
    {/* Other cards will only render if visibility is enabled */}
  </div>
)}
```

With this approach, cards are removed by default but can be re-added via the visibility system.

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/DashboardHome.tsx` | Remove analytics cards from default view |
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Add visibility toggle for Sales KPIs |
| `src/components/dashboard/analytics/OperationsTabContent.tsx` | Add toggles for New Bookings and Capacity |
| `src/components/dashboard/analytics/AppointmentsContent.tsx` | Integrate New Bookings metrics |

## Files to Keep (No Changes)

| File | Reason |
|------|--------|
| `AggregateSalesCard.tsx` | Still used when visibility is enabled |
| `ForecastingCard.tsx` | Still used when visibility is enabled |
| `CapacityUtilizationCard.tsx` | Still used when visibility is enabled |
| `NewBookingsCard.tsx` | Still used when visibility is enabled |
| `CommandCenterVisibilityToggle.tsx` | Already correctly implemented |
| `useDashboardVisibility.ts` | Already correctly implemented |

## User Experience Flow

1. **Default State:** Command Center shows no analytics cards (clean slate)
2. **Customization:** User navigates to Analytics Hub > any tab
3. **Enable Visibility:** Super Admin clicks the gear icon on any card and toggles "Show on Command Center"
4. **Result:** Card now appears on their Command Center dashboard

## Benefits

1. **Single Source of Truth:** Analytics Hub is the primary dashboard
2. **User Control:** Leadership can customize their Command Center
3. **Clean Dashboard:** Command Center isn't cluttered by default
4. **Flexible:** New analytics can be added to Hub and optionally pinned
5. **Existing Infrastructure:** Leverages the visibility system already in place

## Database Considerations

The `dashboard_element_visibility` table already supports this pattern. No database changes are required. The visibility entries for these elements likely already exist and will be updated to default to `is_visible: false` for the Command Center context.
