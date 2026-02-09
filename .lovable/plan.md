
# Implementation Progress

## ✅ Category 1: AI & Automation Enhancements (COMPLETE)
- AI Scheduling Copilot
- Smart Revenue Forecasting  
- Automated Client Follow-ups
- Anomaly Detection Alerts

## ✅ Category 2: Analytics & Reporting Enhancements (COMPLETE)
- Custom Report Builder (Custom Builder sub-tab in Reports)
- Scheduled Reports (Scheduled sub-tab in Reports)
- Visual Comparisons (WaterfallChart in Compare sub-tab)
- Benchmarks & Context Indicators
- Cross-Metric Correlations (Correlations sub-tab in Sales)

---

# Category 2: Analytics & Reporting Enhancements - Full Implementation Plan

## Executive Summary

This plan enhances the existing analytics infrastructure with **Comparative Analytics**, a **Custom Report Builder**, **Scheduled Reports**, **Data Visualization Upgrades**, and **Cross-Metric Dashboards**. The implementation builds on the existing `useComparisonData` hook, `report_history` table, and Recharts-based visualization components.

---

## Current State Analysis

### Existing Infrastructure (All Implemented ✅)

| Component | Status | Location |
|-----------|--------|----------|
| Period Comparison | ✅ Implemented | `useComparisonData.ts`, `CompareTabContent.tsx` |
| Report Generation | ✅ Basic PDF/CSV | `SalesReportGenerator.tsx`, `StaffKPIReport.tsx` |
| Report History | ✅ Tracking only | `report_history` table, `RecentReports.tsx` |
| Sparklines | ✅ Basic | `TrendSparkline.tsx` |
| YoY Comparison | ✅ Implemented | `YearOverYearComparison.tsx` |
| Location Comparison | ✅ Implemented | `LocationComparison.tsx` |
| Analytics Hub | ✅ Tabs structure | `AnalyticsHub.tsx` with 6 main tabs |
| Custom Report Builder | ✅ Implemented | `ReportBuilderPage.tsx` |
| Scheduled Reports | ✅ Implemented | `ScheduledReportsSubTab.tsx` |
| WaterfallChart | ✅ Implemented | `WaterfallChart.tsx` |
| Correlation Matrix | ✅ Implemented | `CorrelationMatrix.tsx`, `CorrelationsContent.tsx` |
| Benchmarks | ✅ Implemented | `BenchmarkBar.tsx`, `useBenchmarks.ts` |

### Identified Gaps (All Resolved ✅)

1. ~~**No Custom Report Builder**~~ → ✅ Implemented
2. ~~**No Scheduled Reports**~~ → ✅ Implemented  
3. ~~**No Visual Diff Mode**~~ → ✅ WaterfallChart added
4. ~~**No Saved Report Templates**~~ → ✅ Template library implemented
5. ~~**Limited Benchmark Data**~~ → ✅ Benchmark indicators added
6. ~~**No Cross-Metric Correlation**~~ → ✅ Correlation analysis added

---

## Implementation Plan

### Feature 1: Custom Report Builder

#### Purpose
Allow users to build custom reports by selecting metrics, dimensions, filters, and visualizations - then save as templates for reuse.

#### Database Changes

```sql
-- Custom report configurations
CREATE TABLE custom_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_shared BOOLEAN DEFAULT false,
  config JSONB NOT NULL, -- { metrics: [], dimensions: [], filters: [], visualization: 'table'|'chart' }
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Track template usage for popularity sorting
CREATE TABLE report_template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES custom_report_templates(id) ON DELETE CASCADE,
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE custom_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_template_usage ENABLE ROW LEVEL SECURITY;

-- RLS: Users see org templates + their own
CREATE POLICY "View org templates" ON custom_report_templates
  FOR SELECT USING (
    organization_id = public.get_user_organization(auth.uid())
    OR created_by = auth.uid()
  );

CREATE POLICY "Manage own templates" ON custom_report_templates
  FOR ALL USING (created_by = auth.uid());
```

#### Config Schema (JSONB)

```typescript
interface ReportConfig {
  metrics: {
    id: string;           // 'total_revenue', 'service_count', etc.
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
    label?: string;       // Custom display name
  }[];
  dimensions: {
    id: string;           // 'date', 'location', 'stylist', 'service_category'
    groupBy?: 'day' | 'week' | 'month';
  }[];
  filters: {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'between' | 'in';
    value: any;
  }[];
  visualization: 'table' | 'bar_chart' | 'line_chart' | 'pie_chart' | 'area_chart';
  dateRange: 'inherit' | 'custom';
  customDateRange?: { from: string; to: string };
}
```

#### Frontend Components

| Component | Description |
|-----------|-------------|
| `ReportBuilderPage.tsx` | Full-page builder with drag-and-drop sections |
| `MetricSelector.tsx` | Multi-select for available metrics |
| `DimensionPicker.tsx` | Choose how to slice data (by date, location, staff) |
| `FilterBuilder.tsx` | Visual filter construction UI |
| `VisualizationPreview.tsx` | Real-time preview of report output |
| `SaveTemplateDialog.tsx` | Save/share template modal |
| `TemplateLibrary.tsx` | Browse and load saved templates |
| `useCustomReport.ts` | Hook to execute custom report configs |

#### Available Metrics Library

```typescript
const AVAILABLE_METRICS = [
  // Revenue Metrics
  { id: 'total_revenue', label: 'Total Revenue', category: 'Revenue', source: 'phorest_daily_sales_summary' },
  { id: 'service_revenue', label: 'Service Revenue', category: 'Revenue', source: 'phorest_daily_sales_summary' },
  { id: 'product_revenue', label: 'Product Revenue', category: 'Revenue', source: 'phorest_daily_sales_summary' },
  { id: 'avg_ticket', label: 'Average Ticket', category: 'Revenue', calculated: true },
  
  // Operations Metrics
  { id: 'appointment_count', label: 'Appointments', category: 'Operations', source: 'phorest_appointments' },
  { id: 'no_show_count', label: 'No-Shows', category: 'Operations', source: 'phorest_appointments' },
  { id: 'cancellation_count', label: 'Cancellations', category: 'Operations', source: 'phorest_appointments' },
  { id: 'utilization_rate', label: 'Utilization %', category: 'Operations', calculated: true },
  
  // Client Metrics
  { id: 'new_clients', label: 'New Clients', category: 'Clients', source: 'phorest_appointments' },
  { id: 'returning_clients', label: 'Returning Clients', category: 'Clients', source: 'phorest_appointments' },
  { id: 'retention_rate', label: 'Retention Rate', category: 'Clients', calculated: true },
  
  // Staff Metrics
  { id: 'staff_revenue', label: 'Revenue per Staff', category: 'Staff', calculated: true },
  { id: 'rebooking_rate', label: 'Rebooking Rate', category: 'Staff', calculated: true },
];
```

---

### Feature 2: Scheduled Reports

#### Purpose
Allow users to schedule reports for automatic generation and email delivery on a recurring basis.

#### Database Changes

```sql
-- Scheduled report configurations
CREATE TABLE scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES custom_report_templates(id) ON DELETE SET NULL,
  report_type TEXT, -- For built-in reports without template
  name TEXT NOT NULL,
  schedule_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'first_of_month', 'last_of_month'
  schedule_config JSONB, -- { dayOfWeek: 1, timeUtc: '09:00', timezone: 'America/Phoenix' }
  recipients JSONB NOT NULL, -- [{ email: '', userId: '' }]
  format TEXT DEFAULT 'pdf', -- 'pdf', 'csv', 'excel'
  filters JSONB, -- Location, date range overrides
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Execution log
CREATE TABLE scheduled_report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_report_id UUID REFERENCES scheduled_reports(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  file_url TEXT,
  recipient_count INTEGER,
  error_message TEXT
);

ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_report_runs ENABLE ROW LEVEL SECURITY;
```

#### Edge Function: `process-scheduled-reports`

```text
supabase/functions/process-scheduled-reports/index.ts

Purpose: Cron job to process due scheduled reports

Schedule: Every hour via pg_cron

Logic:
1. Query scheduled_reports where next_run_at <= now() AND is_active = true
2. For each due report:
   a. Create run record with status = 'running'
   b. Execute report query based on template or report_type
   c. Generate PDF/CSV file
   d. Upload to storage bucket
   e. Send email to recipients via existing email infrastructure
   f. Update run record with status = 'completed'
   g. Calculate and update next_run_at based on schedule_type
3. Handle failures gracefully with retry logic
```

#### Frontend Components

| Component | Description |
|-----------|-------------|
| `ScheduleReportDialog.tsx` | Modal to configure schedule |
| `ScheduledReportsManager.tsx` | List/manage all scheduled reports |
| `ScheduleFrequencyPicker.tsx` | Visual schedule configuration |
| `RecipientSelector.tsx` | Select team members or enter emails |
| `ScheduleRunHistory.tsx` | View past runs and download files |
| `useScheduledReports.ts` | CRUD for scheduled reports |

---

### Feature 3: Visual Comparison Dashboard

#### Purpose
Provide visual overlays and diff views for period-over-period comparisons beyond simple percentage changes.

#### New Visualizations

**3.1 Waterfall Chart for Revenue Changes**

```text
Shows exactly where revenue increased/decreased between periods:

                    $50,000 (This Month)
                       ↑
    [Services +$3,200] ─┤
    [Products +$800]   ─┤
    [New Clients +$1,500] ─┤
    [Cancellations -$500] ─┤
                       ↓
                    $45,000 (Last Month)
```

**3.2 Synchronized Dual-Axis Chart**

```text
Overlay two periods on the same chart with different colored lines:
- Period A (solid line)
- Period B (dashed line)
- Shaded area shows the gap between them
```

**3.3 Delta Heatmap**

```text
Grid showing change intensity by day/hour:
- Green cells: Above average
- Red cells: Below average
- Intensity shows magnitude
```

#### New Components

| Component | Description |
|-----------|-------------|
| `WaterfallChart.tsx` | Vertical waterfall for revenue breakdown |
| `DualPeriodOverlay.tsx` | Two periods on same chart with gap shading |
| `DeltaHeatmap.tsx` | Grid showing change magnitude by dimension |
| `ComparisonDashboard.tsx` | Full comparison dashboard layout |
| `MetricDeltaCard.tsx` | Single metric with visual before/after |
| `TrendComparisonBand.tsx` | Range band showing confidence intervals |

#### Enhanced useComparisonData Hook

```typescript
// Add new return values
interface EnhancedComparisonResult extends ComparisonResult {
  // Waterfall data
  waterfall: {
    category: string;
    delta: number;
    isIncrease: boolean;
  }[];
  
  // Daily overlay data
  dailyOverlay: {
    date: string;
    periodA: number;
    periodB: number;
    delta: number;
  }[];
  
  // Heatmap data
  heatmapData: {
    dimension: string;
    subdimension: string;
    periodA: number;
    periodB: number;
    changePercent: number;
  }[];
}
```

---

### Feature 4: Benchmark & Context Indicators

#### Purpose
Provide context for metrics by showing industry benchmarks, historical averages, and goal progress alongside actual values.

#### Database Changes

```sql
-- Store benchmark data (can be org-specific or industry-wide)
CREATE TABLE metric_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id), -- NULL for industry benchmarks
  metric_key TEXT NOT NULL,
  benchmark_type TEXT NOT NULL, -- 'industry', 'historical_avg', 'goal', 'peer_group'
  value NUMERIC NOT NULL,
  context TEXT, -- 'salon_industry_2025', 'org_90day_avg', etc.
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for org-specific benchmarks
ALTER TABLE metric_benchmarks ENABLE ROW LEVEL SECURITY;
```

#### Benchmark Display Patterns

```typescript
interface BenchmarkContext {
  metricKey: string;
  currentValue: number;
  benchmarks: {
    type: 'industry' | 'historical' | 'goal' | 'peer';
    value: number;
    label: string;
    percentDiff: number;
  }[];
}
```

#### UI Enhancements

**Inline Benchmark Indicators:**

```text
Average Ticket: $85
┌──────────────────────────────────────┐
│ ████████████████████░░░░░ 85%        │
│ ▲ Industry Avg: $78 (+9%)            │
│ ○ Your 90-day Avg: $82 (+4%)         │
│ ◎ Goal: $100 (15% to go)             │
└──────────────────────────────────────┘
```

#### Components

| Component | Description |
|-----------|-------------|
| `BenchmarkBar.tsx` | Horizontal bar with benchmark markers |
| `BenchmarkTooltip.tsx` | Hover tooltip with benchmark details |
| `ContextualMetricCard.tsx` | Metric card with built-in benchmarks |
| `GoalProgressIndicator.tsx` | Visual progress toward goals |
| `useBenchmarks.ts` | Fetch benchmarks for given metrics |

---

### Feature 5: Cross-Metric Correlation Dashboard

#### Purpose
Show how different metrics relate to each other to help identify drivers of business success.

#### Correlation Analysis

**Key Questions Answered:**
- "When service revenue goes up, does product revenue follow?"
- "Do more new clients correlate with higher utilization?"
- "Is there a relationship between rebooking rate and average ticket?"

#### Components

| Component | Description |
|-----------|-------------|
| `CorrelationMatrix.tsx` | Grid showing correlation coefficients |
| `ScatterPlotCard.tsx` | Two metrics plotted against each other |
| `CausationInsights.tsx` | AI-generated insights about relationships |
| `MetricDriversPanel.tsx` | Show what's driving a selected metric |
| `useCorrelationAnalysis.ts` | Calculate correlations from historical data |

#### Calculation Logic

```typescript
interface CorrelationPair {
  metricA: string;
  metricB: string;
  coefficient: number; // -1 to 1
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative';
  dataPoints: number;
}

// Calculate using Pearson correlation coefficient
function calculateCorrelation(dataA: number[], dataB: number[]): number {
  // Standard Pearson formula
  // Returns value between -1 (inverse) and 1 (direct correlation)
}
```

---

## Integration Points

### Analytics Hub Integration

Add new sub-tabs and features to existing structure:

```text
Analytics Hub
├── Sales Tab
│   ├── Overview
│   ├── Goals
│   ├── Compare ← ENHANCED with visual diff
│   ├── Staff Performance
│   ├── Forecasting (AI - from Category 1)
│   ├── Commission
│   └── Correlations ← NEW
├── Operations Tab
│   └── (existing)
├── Marketing Tab
│   └── (existing)
├── Program Tab
│   └── (existing)
├── Reports Tab ← ENHANCED
│   ├── Sales Reports
│   ├── Staff Reports
│   ├── Client Reports
│   ├── Operations Reports
│   ├── Financial Reports
│   ├── Custom Builder ← NEW
│   └── Scheduled ← NEW
└── Rent Tab
    └── (existing)
```

### Command Center Integration

- Custom reports can be pinned to dashboard
- Scheduled report status widget
- Benchmark context on existing pinned cards

---

## Implementation Phases

### Phase 1: Custom Report Builder (Week 1-2)
1. Create `custom_report_templates` and `report_template_usage` tables
2. Build `ReportBuilderPage.tsx` with metric/dimension selection
3. Implement `useCustomReport.ts` for dynamic query execution
4. Add `TemplateLibrary.tsx` for saved templates
5. Integrate into Reports tab

### Phase 2: Scheduled Reports (Week 3-4)
1. Create `scheduled_reports` and `scheduled_report_runs` tables
2. Build `process-scheduled-reports` edge function
3. Set up pg_cron trigger for hourly execution
4. Create `ScheduledReportsManager.tsx` UI
5. Connect to existing email infrastructure

### Phase 3: Visual Comparisons (Week 5-6)
1. Build `WaterfallChart.tsx` and `DualPeriodOverlay.tsx`
2. Enhance `useComparisonData` with waterfall and overlay data
3. Create `ComparisonDashboard.tsx` layout
4. Add visual diff mode to Compare sub-tab

### Phase 4: Benchmarks & Correlations (Week 7-8)
1. Create `metric_benchmarks` table with seed data
2. Build `BenchmarkBar.tsx` and context indicators
3. Implement `useCorrelationAnalysis.ts`
4. Add `CorrelationMatrix.tsx` to Sales tab
5. Generate AI insights for correlations

---

## File Changes Summary

| Category | New Files | Modified Files |
|----------|-----------|----------------|
| Database | 2 migrations | - |
| Edge Functions | 1 new (`process-scheduled-reports`) | - |
| Hooks | 5 new | `useComparisonData.ts` |
| Components | 20+ new | `ReportsTabContent.tsx`, `SalesTabContent.tsx`, `CompareTabContent.tsx` |
| Pages | 1 new (`ReportBuilder`) | `AnalyticsHub.tsx` |

---

## Technical Notes

1. **Custom Reports**: Dynamic query building uses parameterized Supabase queries - never raw SQL injection
2. **Scheduled Reports**: Leverages existing `send-email` edge function for delivery
3. **Benchmarks**: Industry benchmarks seeded from research; org benchmarks calculated from rolling 90-day data
4. **Correlations**: Calculated on the fly from `phorest_daily_sales_summary` (last 90 days)
5. **Performance**: Heavy calculations cached in React Query with 30-minute stale time
6. **RLS**: All new tables have organization-scoped policies

---

## Success Metrics

| Feature | KPI | Target |
|---------|-----|--------|
| Custom Report Builder | Templates created per org | >5 in first month |
| Scheduled Reports | Reports auto-delivered | 90%+ on schedule |
| Visual Comparisons | Time spent on Compare tab | +50% engagement |
| Benchmarks | Benchmark views per session | >3 per user |
| Correlations | Insight actions taken | Track click-through |

---

## UI Mockups

### Custom Report Builder

```text
┌─────────────────────────────────────────────────────────────────────┐
│ REPORT BUILDER                                        [Save] [Run]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  METRICS (drag to add)           CONFIGURATION                      │
│  ┌─────────────────────┐        ┌────────────────────────────────┐ │
│  │ □ Total Revenue     │        │ Grouped by: [Location ▼]       │ │
│  │ □ Service Revenue   │        │ Date Range: [Inherit ▼]        │ │
│  │ ☑ Product Revenue   │        │ Visualization: [Bar Chart ▼]   │ │
│  │ ☑ Avg Ticket        │        └────────────────────────────────┘ │
│  │ □ Appointments      │                                           │
│  │ □ No-Shows          │        PREVIEW                            │
│  │ ...                 │        ┌────────────────────────────────┐ │
│  └─────────────────────┘        │    ████████ Location A $45k   │ │
│                                 │    ██████   Location B $38k   │ │
│  FILTERS                        │    ████     Location C $28k   │ │
│  ┌─────────────────────┐        │                                │ │
│  │ + Add Filter        │        └────────────────────────────────┘ │
│  │ Location = Mesa     │                                           │
│  └─────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Scheduled Reports Manager

```text
┌─────────────────────────────────────────────────────────────────────┐
│ SCHEDULED REPORTS                               [+ Schedule Report] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📊 Weekly Sales Summary                    ⚡ Active          │   │
│  │    Every Monday at 8:00 AM                                   │   │
│  │    Recipients: owner@salon.com, manager@salon.com            │   │
│  │    Last run: Feb 5, 2026 · Next: Feb 12, 2026               │   │
│  │    [View History] [Edit] [Pause]                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📈 Monthly Revenue Report                  ⏸ Paused          │   │
│  │    1st of each month at 9:00 AM                              │   │
│  │    Recipients: accounting@salon.com                          │   │
│  │    Last run: Jan 1, 2026 · Next: —                          │   │
│  │    [View History] [Edit] [Resume]                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Waterfall Comparison Chart

```text
Revenue Change: This Month vs Last Month

    Last Month Total   ██████████████████████████████████  $45,000
                                                       │
    + Services         ███████  +$3,200               ─┤
    + Products         ███  +$800                     ─┤
    + New Clients      █████  +$1,500                 ─┤
    − Cancellations    ██  -$500                      ─┤
                                                       │
    This Month Total   ██████████████████████████████████████  $50,000
                                                       ↑
                                                   +11.1%
```
