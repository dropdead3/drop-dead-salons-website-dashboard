

# Move Forecasting to Analytics Hub Sales Page

## Current State

| Component | Location | Description |
|-----------|----------|-------------|
| `ForecastingCard` | Command Center (via CommandCenterAnalytics.tsx) | Full-featured: 4 time periods (Tomorrow/7/30/60 days), bar charts, location filter, click-to-view appointments |
| `RevenueForecast` | Analytics Hub > Sales > Forecasting tab | Simpler: Month-end projection with progress bar and trend line |
| `HistoricalComparison` | Analytics Hub > Sales > Forecasting tab | Year-over-year comparison |

## Problem

The Analytics Hub's "Forecasting" sub-tab has a simpler `RevenueForecast` component, while the Command Center has the richer `ForecastingCard`. This creates redundancy and inconsistency.

## Solution

Consolidate by adding the `ForecastingCard` to the Analytics Hub Sales > Forecasting tab as the primary forecasting tool, keeping `RevenueForecast` as a supplementary month-end projection view.

## Implementation Plan

### Phase 1: Enhance Forecasting Tab in Analytics Hub

**File: `src/components/dashboard/analytics/SalesTabContent.tsx`**

Update the Forecasting tab content (lines 432-443) to include:
1. The full `ForecastingCard` component at the top
2. Keep `RevenueForecast` as a secondary "Month-End Projection" card
3. Keep `HistoricalComparison` for year-over-year insights

Changes:
- Import `ForecastingCard` from `@/components/dashboard/sales/ForecastingCard`
- Add `ForecastingCard` as the first element in the Forecasting tab

### Phase 2: No Changes to CommandCenterAnalytics

The `CommandCenterAnalytics.tsx` already handles `ForecastingCard` via the `week_ahead_forecast` visibility key. No changes needed - it will continue to render when pinned.

### Phase 3: Verify Visibility Toggle Exists

The visibility toggle for `week_ahead_forecast` is already in place (line 144-147 of SalesTabContent.tsx). This allows Super Admins to pin/unpin forecasting to the Command Center directly from the Sales tab header.

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/analytics/SalesTabContent.tsx` | Add `ForecastingCard` to the Forecasting tab content |

## Updated Forecasting Tab Layout

```text
Analytics Hub > Sales > Forecasting Tab
┌──────────────────────────────────────────────────────┐
│  ForecastingCard                                     │
│  ┌────────────────────────────────────────────────┐  │
│  │ Tomorrow │ 7 Days │ 30 Days │ 60 Days          │  │
│  │ Location Filter        [X bookings]            │  │
│  │ ┌──────┬──────┬──────┐                         │  │
│  │ │ Total│ Avg  │ Appts│  Summary KPIs           │  │
│  │ └──────┴──────┴──────┘                         │  │
│  │ ▓▓▓ ▓▓▓▓ ▓▓ ▓▓▓▓▓  Bar Chart with Peak        │  │
│  │ Mon Tue Wed Thu Fri                            │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  RevenueForecast (Month-End Projection)              │
│  ┌────────────────────────────────────────────────┐  │
│  │ Progress toward monthly goal                   │  │
│  │ ████████████░░░░░░░░  75% achieved             │  │
│  │ Trend line with projection                     │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  HistoricalComparison (Year-over-Year)               │
│  ┌────────────────────────────────────────────────┐  │
│  │ Compare current period to same period last yr  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

## Data Flow

```text
Analytics Hub (Source of Truth)
└── Sales Tab
    └── Forecasting Sub-Tab
        ├── ForecastingCard ─────[⚙ Pin Toggle]──► Command Center
        ├── RevenueForecast (Month-End Projection)
        └── HistoricalComparison
```

## Technical Details

- **Import Addition**: Add `ForecastingCard` import to SalesTabContent.tsx
- **Tab Content Update**: Insert `<ForecastingCard />` at the start of the "forecasting" TabsContent
- **Visibility Toggle**: Already exists in header (elementKey: `week_ahead_forecast`)
- **No Database Changes**: Uses existing visibility system

## Benefits

1. **Consolidated**: All forecasting tools in one location (Analytics Hub)
2. **Consistent**: Command Center displays the same component via pinning
3. **User Control**: Super Admins can toggle forecasting visibility on Command Center
4. **Rich Features**: 4 time periods, location filtering, click-to-drill-down all accessible from Analytics Hub

