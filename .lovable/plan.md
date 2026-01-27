
# Analytics & Reports Hub: Unified Data Dashboard

## Overview

Transform the Reports Hub into a **unified Analytics & Reports center** that consolidates all analytics pages as tabs within a single cohesive experience. This eliminates navigation fragmentation and creates a single source of truth for business intelligence.

## Current State

| Page | Route | Purpose |
|------|-------|---------|
| Sales Dashboard | `/dashboard/admin/sales` | Revenue, stylist performance |
| Operational Analytics | `/dashboard/admin/operational-analytics` | Appointments, capacity, clients |
| Marketing Analytics | `/dashboard/admin/marketing` | Campaigns, leads, ROI |
| Reports Hub | `/dashboard/admin/reports` | PDF/CSV exports |
| Program Analytics | `/dashboard/admin/program-analytics` | Client Engine metrics |

**Problem:** 5 separate pages with overlapping filters, redundant navigation, and inconsistent layouts.

## Proposed Architecture

```text
/dashboard/admin/analytics ← New unified route (or rename /reports to /analytics)

┌─────────────────────────────────────────────────────────────────────────┐
│  ANALYTICS & REPORTS                        [Location ▾] [Date Range]  │
├─────────────────────────────────────────────────────────────────────────┤
│  [Sales] [Operations] [Marketing] [Program] [Reports]                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Selected Tab Content                                            │   │
│  │  (e.g., Sales: Revenue charts, stylist leaderboard, trends)      │   │
│  │                                                                   │   │
│  │  Each tab can have its own sub-tabs if needed                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tab Structure

| Tab | Content Source | Sub-tabs (if any) |
|-----|---------------|-------------------|
| **Sales** | Current SalesDashboard.tsx | Overview, Goals, Staff Performance, Forecasting |
| **Operations** | Current OperationalAnalytics.tsx | Overview, Appointments, Clients, Staffing, Utilization |
| **Marketing** | Current MarketingAnalytics.tsx | Overview, Campaigns, Sources |
| **Program** | Current ProgramAnalytics.tsx | Enrollment, Completion, Cohorts |
| **Reports** | Current ReportsHub exports | Sales, Staff, Clients, Operations, Financial |

## Navigation Changes

### Before (Current Sidebar)
```text
Stats & Leaderboard
├── My Stats
├── My Clients
├── Leaderboard
├── Sales Dashboard        ← Separate page
├── Operational Analytics  ← Separate page
├── Marketing Analytics    ← Separate page
└── Reports Hub           ← Separate page
```

### After (Renamed Section)
```text
Stats & Analytics
├── My Stats
├── My Clients
├── Leaderboard
└── Analytics Hub         ← Single unified entry point
```

## Implementation Approach

### Phase 1: Create Unified Analytics Page

1. **Rename and repurpose ReportsHub.tsx** → `AnalyticsHub.tsx`
2. **Update route** from `/dashboard/admin/reports` to `/dashboard/admin/analytics`
3. **Create shared filter bar** with location and date range that passes to all tabs
4. **Implement tab-based navigation** using URL params (`?tab=sales`, `?tab=operations`, etc.)

### Phase 2: Extract Tab Content Components

Move the content from each current page into dedicated tab content components:

| Current File | Becomes |
|--------------|---------|
| `SalesDashboard.tsx` | `src/components/dashboard/analytics/SalesTabContent.tsx` |
| `OperationalAnalytics.tsx` | Already modular → Keep as `OperationalAnalytics` content components |
| `MarketingAnalytics.tsx` | `src/components/dashboard/analytics/MarketingTabContent.tsx` |
| `ProgramAnalytics.tsx` | `src/components/dashboard/analytics/ProgramTabContent.tsx` |
| `ReportsHub.tsx` (exports) | `src/components/dashboard/analytics/ReportsTabContent.tsx` |

### Phase 3: Update Routing and Navigation

1. **Add redirect routes** for old URLs to preserve bookmarks:
   - `/dashboard/admin/sales` → `/dashboard/admin/analytics?tab=sales`
   - `/dashboard/admin/operational-analytics` → `/dashboard/admin/analytics?tab=operations`
   - `/dashboard/admin/marketing` → `/dashboard/admin/analytics?tab=marketing`
   - `/dashboard/admin/program-analytics` → `/dashboard/admin/analytics?tab=program`
   - `/dashboard/admin/reports` → `/dashboard/admin/analytics?tab=reports`

2. **Update sidebar navigation** to single "Analytics Hub" entry

3. **Rename sidebar section** from "Stats & Leaderboard" to "Stats & Analytics"

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/dashboard/admin/AnalyticsHub.tsx` | New unified page with tab navigation |
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Extracted sales content |
| `src/components/dashboard/analytics/MarketingTabContent.tsx` | Extracted marketing content |
| `src/components/dashboard/analytics/ProgramTabContent.tsx` | Extracted program content |
| `src/components/dashboard/analytics/ReportsTabContent.tsx` | Export functionality |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add new route, add redirects for old routes |
| `src/components/dashboard/DashboardLayout.tsx` | Update sidebar nav items, rename section |
| `src/hooks/useSidebarLayout.ts` | Update default link order |

## Files to Keep (For Now)

The original page files can be kept as simple redirects or removed after confirming the new structure works. This provides a safe migration path.

## Shared Components

The new Analytics Hub will leverage these existing components:

- **Filter Bar**: Location selector + Date range tabs (already exist in each page)
- **Command Center Toggle**: For visibility management
- **Tab-specific Content**: Reuse all existing charts, cards, and visualizations

## Benefits

1. **Single entry point** - One place for all business intelligence
2. **Consistent filtering** - Location and date range apply across all tabs
3. **Reduced navigation** - Fewer sidebar items, cleaner menu
4. **Better discoverability** - Users see all analytics options at once
5. **Easier maintenance** - Shared layout and filter logic
6. **URL deep-linking** - `?tab=sales&subtab=forecasting` preserves state

## Technical Details

### URL State Management
```tsx
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get('tab') || 'sales';
const subTab = searchParams.get('subtab') || 'overview';
```

### Shared Filter Context (Optional Enhancement)
```tsx
interface AnalyticsFilters {
  locationId: string;
  dateRange: '7d' | '30d' | '90d' | 'mtd' | 'ytd';
  dateFrom?: Date;
  dateTo?: Date;
}

// Passed to all tab content components
<SalesTabContent filters={filters} />
<OperationsTabContent filters={filters} />
```

### Tab Definition
```tsx
const analyticsCategories = [
  { id: 'sales', label: 'Sales', icon: DollarSign },
  { id: 'operations', label: 'Operations', icon: BarChart3 },
  { id: 'marketing', label: 'Marketing', icon: TrendingUp },
  { id: 'program', label: 'Program', icon: Target },
  { id: 'reports', label: 'Reports', icon: FileText },
];
```

## Summary

This consolidation creates a premium, unified analytics experience while:
- Reusing all existing visualization components
- Maintaining backward compatibility with redirects
- Simplifying the navigation structure
- Providing a consistent user experience across all analytics domains
