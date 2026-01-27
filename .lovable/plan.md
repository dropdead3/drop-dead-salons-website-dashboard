
# Enable Role-Based Tab Control Across Application

## Overview

This plan wraps all page tabs with the `VisibilityGate` component to enable automatic registration in the Role Access Configurator. Once wrapped, tabs will:
1. Auto-register in the `dashboard_element_visibility` database table on first render
2. Appear in the **Role Access → Page Tabs** panel for per-role visibility control
3. Be controllable for each of the 8 system roles

## Naming Convention

All tab element keys will follow the pattern: `{pageKey}_{tabId}_tab`

**Examples:**
- `stats_performance_tab` - My Stats → Performance tab
- `analytics_sales_tab` - Analytics Hub → Sales tab
- `sales_forecasting_subtab` - Sales → Forecasting sub-tab

## Pages & Tabs to Wrap

### 1. My Stats Page (`src/pages/dashboard/Stats.tsx`)

| Tab | Element Key | Element Name |
|-----|-------------|--------------|
| My Performance | `stats_performance_tab` | My Performance |
| Team Leaderboard | `stats_leaderboard_tab` | Team Leaderboard |

### 2. Analytics Hub (`src/pages/dashboard/admin/AnalyticsHub.tsx`)

**Main Tabs:**
| Tab | Element Key | Element Name |
|-----|-------------|--------------|
| Sales | `analytics_sales_tab` | Sales |
| Operations | `analytics_operations_tab` | Operations |
| Marketing | `analytics_marketing_tab` | Marketing |
| Program | `analytics_program_tab` | Program |
| Reports | `analytics_reports_tab` | Reports |

### 3. Operations Sub-Tabs (`src/components/dashboard/analytics/OperationsTabContent.tsx`)

| Sub-Tab | Element Key | Element Name |
|---------|-------------|--------------|
| Overview | `operations_overview_subtab` | Overview |
| Appointments | `operations_appointments_subtab` | Appointments |
| Clients | `operations_clients_subtab` | Clients |
| Staffing | `operations_staffing_subtab` | Staffing |
| Staff Utilization | `operations_staff_utilization_subtab` | Staff Utilization |

### 4. Sales Sub-Tabs (`src/components/dashboard/analytics/SalesTabContent.tsx`)

| Sub-Tab | Element Key | Element Name |
|---------|-------------|--------------|
| Overview | `sales_overview_subtab` | Overview |
| Goals | `sales_goals_subtab` | Goals |
| Staff Performance | `sales_staff_subtab` | Staff Performance |
| Forecasting | `sales_forecasting_subtab` | Forecasting |
| Commission | `sales_commission_subtab` | Commission |

### 5. Reports Sub-Tabs (`src/components/dashboard/analytics/ReportsTabContent.tsx`)

| Sub-Tab | Element Key | Element Name |
|---------|-------------|--------------|
| Sales | `reports_sales_subtab` | Sales Reports |
| Staff | `reports_staff_subtab` | Staff Reports |
| Clients | `reports_clients_subtab` | Client Reports |
| Operations | `reports_operations_subtab` | Operations Reports |
| Financial | `reports_financial_subtab` | Financial Reports |

### 6. Day Rate Settings (`src/pages/dashboard/admin/DayRateSettings.tsx`)

| Tab | Element Key | Element Name |
|-----|-------------|--------------|
| Chair Inventory | `dayrate_chairs_tab` | Chair Inventory |
| Agreement | `dayrate_agreement_tab` | Agreement |

### 7. Dashboard Widgets (`src/components/dashboard/WidgetsSection.tsx`)

| Widget | Element Key | Element Name |
|--------|-------------|--------------|
| What's New | `widget_changelog` | What's New Widget |
| Team Birthdays | `widget_birthdays` | Team Birthdays Widget |
| Work Anniversaries | `widget_anniversaries` | Work Anniversaries Widget |
| My Schedule | `widget_schedule` | My Schedule Widget |
| Day Rate Bookings | `widget_dayrate` | Day Rate Bookings Widget |

## Implementation Pattern

For each tab, wrap the `TabsTrigger` with `VisibilityGate`:

```typescript
// Before
<TabsTrigger value="sales">Sales</TabsTrigger>

// After
<VisibilityGate 
  elementKey="analytics_sales_tab" 
  elementName="Sales" 
  elementCategory="Page Tabs"
>
  <TabsTrigger value="sales">Sales</TabsTrigger>
</VisibilityGate>
```

For widgets:

```typescript
// Before
{isWidgetEnabled('changelog') && <ChangelogWidget />}

// After
<VisibilityGate 
  elementKey="widget_changelog" 
  elementName="What's New Widget" 
  elementCategory="Dashboard Widgets"
>
  {isWidgetEnabled('changelog') && <ChangelogWidget />}
</VisibilityGate>
```

## File Changes Summary

| File | Changes |
|------|---------|
| `src/pages/dashboard/Stats.tsx` | Import VisibilityGate, wrap 2 tabs |
| `src/pages/dashboard/admin/AnalyticsHub.tsx` | Import VisibilityGate, wrap 5 tabs in loop |
| `src/components/dashboard/analytics/OperationsTabContent.tsx` | Import VisibilityGate, wrap 5 sub-tabs |
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Import VisibilityGate, wrap 5 sub-tabs |
| `src/components/dashboard/analytics/ReportsTabContent.tsx` | Import VisibilityGate, wrap 5 sub-tabs |
| `src/pages/dashboard/admin/DayRateSettings.tsx` | Import VisibilityGate, wrap 2 tabs |
| `src/components/dashboard/WidgetsSection.tsx` | Import VisibilityGate, wrap 5 widgets |

## Future-Proofing

Any new tabs added to the application should follow this pattern:

```typescript
<VisibilityGate 
  elementKey="{pageKey}_{tabId}_tab" 
  elementName="Tab Display Name" 
  elementCategory="Page Tabs"
>
  <TabsTrigger value="tabId">Tab Display Name</TabsTrigger>
</VisibilityGate>
```

Once wrapped and rendered by any user, the tab will automatically appear in **Settings → Role Access → Page Tabs** for visibility management.

## Technical Details

### How Auto-Registration Works

1. When `VisibilityGate` renders with `elementName` and `elementCategory` props, it calls `registerMutation.mutate()`
2. This inserts a row into `dashboard_element_visibility` for each role
3. The database trigger `sync_visibility_for_new_role` ensures new roles also get entries

### Visibility Logic

- Elements default to **visible** (`is_visible: true`) when first registered
- Admins can toggle visibility per-role in the Role Access Configurator
- If any of a user's roles has visibility enabled, the element shows (union logic)

## Total Tabs/Widgets Being Registered

- **Page Tabs**: 24 tabs across 6 pages/components
- **Dashboard Widgets**: 5 widgets
- **Total**: 29 controllable elements

