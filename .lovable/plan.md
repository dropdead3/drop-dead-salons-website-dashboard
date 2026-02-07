

# Payroll Hub Analytics Enhancement Plan

## Executive Summary

Transform the Payroll Hub into an enterprise-grade analytics dashboard with real-time payroll insights, forecasting, commission optimization, and deep per-stylist compensation analysis. This plan leverages existing Phorest sales data, commission tier configuration, and payroll history to deliver actionable financial intelligence.

---

## Current State Analysis

**What exists:**
- Basic payroll wizard with steps for hours, commissions, adjustments, and review
- Commission tier system with service/product splits
- Employee payroll settings (hourly, salary, commission combinations)
- Payroll history table with expandable details
- Sales data from `phorest_daily_sales_summary`
- Pay schedule configuration

**What's missing:**
- Real-time payroll forecasting and projections
- Per-employee commission tier progression visualization
- Historical payroll trend analysis with charts
- Labor cost analysis and optimization insights
- Period-over-period comparison tools
- Commission tier performance analytics

---

## Proposed Architecture

### New Tab Structure

| Tab | Purpose | Status |
|-----|---------|--------|
| **Overview** | Executive dashboard with KPIs and forecasts | NEW |
| Run Payroll | Existing wizard | EXISTS |
| History | Enhanced with analytics | ENHANCE |
| Team Breakdown | Per-employee deep-dive | NEW |
| Commission Insights | Tier performance & optimization | NEW |
| Settings | Pay schedule & provider config | EXISTS |

---

## Phase 1: Payroll Overview Dashboard

### 1.1 Executive KPI Cards

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PAYROLL OVERVIEW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ NEXT PAYROLL │  │ YTD PAYROLL  │  │ AVG LABOR    │  │ COMMISSION   │    │
│  │   FORECAST   │  │    TOTAL     │  │    COST      │  │    RATIO     │    │
│  │  $47,250     │  │  $284,500    │  │    32%       │  │    45%       │    │
│  │  ▲ 3.2%      │  │  of revenue  │  │  of revenue  │  │  of gross pay│    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ EMPLOYER     │  │ ACTIVE       │  │ OVERTIME     │  │ TIPS         │    │
│  │ TAX BURDEN   │  │ EMPLOYEES    │  │   HOURS      │  │  COLLECTED   │    │
│  │  $4,580      │  │     12       │  │    28 hrs    │  │   $3,240     │    │
│  │  9.7% of pay │  │  on payroll  │  │  this period │  │  this period │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**KPIs to Track:**
- Next Payroll Forecast (calculated from current period sales + hours estimate)
- YTD Total Payroll Cost
- Labor Cost as % of Revenue
- Commission as % of Gross Pay
- Employer Tax Liability
- Active Employee Count
- Total Overtime Hours
- Tips Collected

### 1.2 Payroll Forecast Chart

Interactive area chart showing:
- Historical payroll amounts (last 12 pay periods)
- Rolling average trendline
- Forecast for next 2-3 periods based on:
  - Current period sales data
  - Historical averages
  - Scheduled appointments (if available)
  - Commission tier calculations

**Forecast Algorithm:**
```typescript
interface PayrollForecast {
  periodStart: string;
  periodEnd: string;
  projectedGross: number;
  projectedNet: number;
  projectedCommissions: number;
  projectedTaxes: number;
  confidence: 'high' | 'medium' | 'low';
  factors: {
    salesProjection: number;
    scheduledAppointments: number;
    historicalAverage: number;
  };
}
```

### 1.3 Compensation Breakdown Pie Chart

Visual breakdown showing:
- Base Pay (Hourly + Salary) %
- Service Commissions %
- Product Commissions %
- Bonuses %
- Tips %

---

## Phase 2: Team Breakdown Analytics

### 2.1 Employee Compensation Table with Drill-Down

Enhanced table showing all employees with:

| Column | Description |
|--------|-------------|
| Employee | Name + photo + pay type badge |
| Base Pay | Hourly/salary amount |
| Commission Rate | Current tier + progress to next tier |
| Period Sales | Service + Product revenue |
| Projected Pay | Calculated based on current sales |
| YTD Earnings | Total earnings this year |
| Trend | Sparkline of last 6 periods |

### 2.2 Individual Employee Detail Modal

Click into any employee to see:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SARAH JOHNSON - COMPENSATION DETAIL                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │  PAY CONFIGURATION              │  │  CURRENT PERIOD PROJECTION      │  │
│  │  ─────────────────              │  │  ─────────────────────────────  │  │
│  │  Type: Hourly + Commission      │  │  Service Revenue:    $8,450    │  │
│  │  Hourly Rate: $18.00            │  │  Product Revenue:    $1,230    │  │
│  │  Commission: Enabled            │  │  Current Tier: "Bronze" (35%)  │  │
│  │  Service Rate: 35%              │  │  ───────────────────────────── │  │
│  │  Product Rate: 10%              │  │  Hourly (80 hrs): $1,440       │  │
│  │                                 │  │  Service Comm:    $2,957       │  │
│  │                                 │  │  Product Comm:    $123         │  │
│  │                                 │  │  ═══════════════════════════════│  │
│  │                                 │  │  PROJECTED GROSS: $4,520       │  │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  TIER PROGRESSION                                                      │  │
│  │  ─────────────────────────────────────────────────────────────────────│  │
│  │  Current: Bronze (35%) │ Next: Silver (40%) at $10,000 service rev   │  │
│  │                                                                        │  │
│  │  [████████████████████░░░░░░░░░░] 84.5% to next tier                  │  │
│  │   $8,450 of $10,000                                                   │  │
│  │                                                                        │  │
│  │  💡 $1,550 more in services to unlock 5% higher commission rate       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  EARNINGS HISTORY (Last 6 Pay Periods)                                │  │
│  │  [Area chart showing gross pay trend over time]                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 3: Commission Insights & Optimization

### 3.1 Commission Tier Performance Dashboard

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMMISSION TIER ANALYTICS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TIER DISTRIBUTION (Current Period)                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │   Bronze (30-35%)  ████████████████  6 stylists ($48,200 revenue)      ││
│  │   Silver (40%)     ████████         3 stylists ($32,100 revenue)       ││
│  │   Gold (45%)       ████             2 stylists ($28,400 revenue)       ││
│  │   Platinum (50%)   ██               1 stylist  ($18,600 revenue)       ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  TIER PROGRESSION OPPORTUNITIES                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  3 stylists are within 15% of reaching the next tier                    ││
│  │                                                                          ││
│  │  👤 Sarah J.   Bronze → Silver   $1,550 more needed   (84.5% complete) ││
│  │  👤 Mike R.    Silver → Gold     $2,100 more needed   (79.0% complete) ││
│  │  👤 Lisa K.    Bronze → Silver   $3,200 more needed   (68.0% complete) ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  COMMISSION IMPACT ANALYSIS                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  This Period:     $18,450 in commissions   (36% of gross payroll)      ││
│  │  If all hit next tier: +$2,340 additional  (potential 12.7% increase)  ││
│  │  Revenue needed:  +$12,850 in services                                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Commission Tier Editor Enhancement

Add visual tier editor with:
- Drag-to-adjust tier thresholds
- Revenue band visualization
- Impact simulator ("What if service commission was 40% instead of 35%?")
- Historical effectiveness analysis

---

## Phase 4: Payroll Forecasting Engine

### 4.1 New Hook: `usePayrollForecasting`

```typescript
// src/hooks/usePayrollForecasting.ts

export interface PayrollProjection {
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  
  // Projected values
  projectedGrossPay: number;
  projectedCommissions: number;
  projectedTaxes: number;
  projectedNetPay: number;
  
  // Breakdown
  byEmployee: EmployeeProjection[];
  
  // Confidence metrics
  confidenceLevel: 'high' | 'medium' | 'low';
  dataPointsUsed: number;
  
  // Comparison
  vsLastPeriod: number; // percentage change
  vsYearAgo: number; // percentage change
}

export interface EmployeeProjection {
  employeeId: string;
  employeeName: string;
  photoUrl: string | null;
  
  currentPeriodSales: {
    services: number;
    products: number;
  };
  
  projectedSales: {
    services: number;
    products: number;
  };
  
  currentTier: string;
  tierProgress: number; // 0-100
  nextTierThreshold: number | null;
  
  projectedCompensation: {
    basePay: number;
    serviceCommission: number;
    productCommission: number;
    totalGross: number;
  };
}

export function usePayrollForecasting(organizationId: string) {
  // Calculate projections based on:
  // 1. Current period sales to-date
  // 2. Days remaining in period
  // 3. Historical daily averages
  // 4. Scheduled appointments (if available)
  // 5. Seasonality adjustments
}
```

### 4.2 Forecasting Algorithm

**Step 1: Current Period Projection**
```
projectedSales = currentSales + (dailyAverage × daysRemaining)
```

**Step 2: Apply Commission Tiers**
```
For each employee:
  - Calculate projected revenue
  - Determine which tier they'll land in
  - Calculate commission at that tier rate
```

**Step 3: Aggregate Totals**
```
projectedGross = Σ(basePay + commissions + tips)
projectedTaxes = projectedGross × taxRates
projectedNet = projectedGross - projectedTaxes - deductions
```

---

## Phase 5: Enhanced History & Analytics

### 5.1 Historical Trend Charts

Add to History tab:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  PAYROLL TRENDS (Last 12 Periods)                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Stacked area chart showing:]                                              │
│  - Total Gross Pay                                                          │
│  - Commission portion                                                       │
│  - Base pay portion                                                         │
│  - Tax withholdings                                                         │
│                                                                              │
│  [Toggle between: Absolute $ | % of Revenue | Per Employee Avg]            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Period-over-Period Comparison

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  PERIOD COMPARISON                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Compare: [Jan 16-31 ▼] vs [Jan 1-15 ▼]                                    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Metric              Period 1        Period 2        Change             ││
│  │  ───────────────────────────────────────────────────────────────────────││
│  │  Gross Payroll       $45,200         $47,800         +5.8% ▲            ││
│  │  Commissions         $18,400         $19,200         +4.3% ▲            ││
│  │  Avg per Employee    $3,766          $3,983          +5.8% ▲            ││
│  │  Overtime Hours      24 hrs          32 hrs          +33.3% ▲           ││
│  │  Labor Cost %        31.2%           30.8%           -0.4% ▼            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Changes Required

### New Table: `payroll_forecasts` (optional, for caching)

```sql
CREATE TABLE payroll_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  forecast_data JSONB NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, period_start, period_end)
);
```

### New Table: `payroll_analytics_snapshots` (for historical trends)

```sql
CREATE TABLE payroll_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  snapshot_date DATE NOT NULL,
  metrics JSONB NOT NULL,
  -- Sample metrics:
  -- {
  --   "ytd_gross": 284500,
  --   "ytd_commissions": 128250,
  --   "labor_cost_ratio": 0.32,
  --   "commission_ratio": 0.45,
  --   "active_employees": 12,
  --   "avg_pay_per_employee": 3954
  -- }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, snapshot_date)
);
```

---

## New Components to Create

| Component | Location | Purpose |
|-----------|----------|---------|
| `PayrollOverview.tsx` | `src/components/dashboard/payroll/` | Executive dashboard with KPIs |
| `PayrollForecastChart.tsx` | `src/components/dashboard/payroll/analytics/` | Forecast visualization |
| `CompensationBreakdownChart.tsx` | `src/components/dashboard/payroll/analytics/` | Pie chart of pay types |
| `TeamCompensationTable.tsx` | `src/components/dashboard/payroll/analytics/` | Employee grid with projections |
| `EmployeeCompensationModal.tsx` | `src/components/dashboard/payroll/analytics/` | Deep-dive employee modal |
| `TierProgressionCard.tsx` | `src/components/dashboard/payroll/analytics/` | Commission tier progress |
| `CommissionInsights.tsx` | `src/components/dashboard/payroll/` | Tier analytics tab content |
| `PayrollTrendChart.tsx` | `src/components/dashboard/payroll/analytics/` | Historical stacked area chart |
| `PeriodComparisonCard.tsx` | `src/components/dashboard/payroll/analytics/` | Side-by-side comparison |

## New Hooks to Create

| Hook | Purpose |
|------|---------|
| `usePayrollForecasting` | Calculate projections for current/future periods |
| `usePayrollAnalytics` | Aggregate metrics for overview dashboard |
| `useEmployeeCompensationDetails` | Per-employee deep-dive data |
| `useTierDistribution` | Commission tier analytics |
| `usePayrollTrends` | Historical trend data for charts |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/admin/Payroll.tsx` | Add new tabs, restructure layout |
| `src/hooks/useCommissionTiers.ts` | Add tier progression calculation |
| `src/hooks/usePayrollCalculations.ts` | Add forecasting methods |
| `src/components/dashboard/payroll/PayrollHistoryTable.tsx` | Add trend charts |

---

## Implementation Priority

| Priority | Feature | Estimated Complexity |
|----------|---------|---------------------|
| 1 | Overview Dashboard with KPIs | Medium |
| 2 | Current Period Forecasting | Medium |
| 3 | Team Breakdown Table | Medium |
| 4 | Employee Detail Modal with Tier Progress | Medium |
| 5 | Commission Insights Tab | High |
| 6 | Historical Trend Charts | Medium |
| 7 | Period Comparison Tool | Low |
| 8 | Forecast Chart (multi-period) | High |

---

## Additional Enhancement Suggestions

1. **Export Capabilities**: PDF payroll reports, CSV data exports
2. **Notification System**: Alerts when employees approach tier thresholds
3. **Budget vs Actual**: Set payroll budget and track variance
4. **Seasonal Analysis**: Identify high/low payroll months
5. **What-If Simulator**: "If we hire 2 more stylists..." impact analysis
6. **Commission Leaderboard**: Gamify sales with rankings
7. **Mobile Payroll Summary**: Quick stats for managers on-the-go
8. **Audit Trail**: Track all payroll adjustments and overrides

