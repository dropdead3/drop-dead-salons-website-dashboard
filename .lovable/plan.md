
# Full Reports Page Implementation

## Overview

Build a comprehensive Reports Hub at `/dashboard/admin/reports` that consolidates all reporting capabilities and adds new report types based on Phorest API data. This page will serve as the central location for generating, viewing, and exporting all business reports.

## Available Phorest Report Data Sources

Based on the Phorest API, these data sources are available for reporting:

| CSV Export Type | Data Contents |
|-----------------|---------------|
| `TRANSACTIONS_CSV` | Full transaction details: client names, staff, products/services, prices, discounts |
| `SUNDRIES_CSV` | Petty cash and miscellaneous sales |
| `CLIENT_COURSES_CSV` | Client packages, memberships, course purchases |

| API Endpoint | Metrics Available |
|--------------|-------------------|
| `/report/staff-performance` | New clients, retention rate, retail sales, avg ticket, rebooking rate, utilization |
| `/report/sales` | Sales summary aggregations |
| `/appointment` | Bookings, no-shows, services performed, timing |
| `/client` | Demographics, visit history, lifetime value |
| `/product` | Inventory levels, product performance |
| `/review` | Staff ratings and feedback |

---

## Report Categories

### 1. Sales Reports (Already Partially Built)
- **Daily Sales Summary** - Revenue by day with service/product split
- **Sales by Stylist** - Individual performance rankings
- **Sales by Location** - Multi-location comparison
- **Product Sales Report** - Top products, categories, attachment rates
- **Service Sales Report** - Popular services, average prices

### 2. Staff Performance Reports (New)
- **Staff KPI Report** - Comprehensive staff metrics from `/report/staff-performance`
- **Productivity Report** - Hours worked vs. revenue generated
- **Rebooking Analysis** - Staff rebooking rates and trends
- **New Client Acquisition** - Who's bringing in new clients

### 3. Client Reports (New)
- **Client Retention Report** - Return rates, at-risk clients
- **Client Lifetime Value** - Top spenders, average LTV
- **New vs. Returning Clients** - Acquisition funnel analysis
- **Client Visit Frequency** - Visit patterns by segment

### 4. Operational Reports (New)
- **Capacity Utilization** - Booking density, peak hours
- **No-Show Report** - No-show rates by staff, day, time
- **Service Duration Analysis** - Actual vs. expected times
- **Appointment Lead Time** - How far ahead clients book

### 5. Financial Reports (Enhanced)
- **Revenue Trend Report** - Daily/weekly/monthly trends
- **Commission Report** - Staff earnings calculations
- **Goal Progress Report** - Team and individual goal tracking
- **Year-over-Year Comparison** - Historical performance

---

## Database Changes

Create a table to store generated reports for quick access and scheduling:

```sql
CREATE TABLE report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  report_name TEXT NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  parameters JSONB DEFAULT '{}',
  generated_by UUID REFERENCES employee_profiles(user_id),
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_report_history_type ON report_history(report_type);
CREATE INDEX idx_report_history_date ON report_history(created_at DESC);
```

---

## New Files to Create

### 1. Reports Hub Page
**File:** `src/pages/dashboard/admin/ReportsHub.tsx`

Main page with:
- Category navigation (tabs or sidebar)
- Report type cards with descriptions
- Date range selector
- Location filter
- Generate/Export buttons
- Recent reports list

### 2. Report Generator Components
**Files in** `src/components/dashboard/reports/`:

| Component | Purpose |
|-----------|---------|
| `ReportCategoryTabs.tsx` | Navigation between report categories |
| `ReportCard.tsx` | Individual report type selector card |
| `ReportFilters.tsx` | Shared date range, location, staff filters |
| `ReportPreview.tsx` | Preview report data before export |
| `ReportExportOptions.tsx` | PDF, CSV, Google Sheets export options |
| `RecentReports.tsx` | List of recently generated reports |
| `StaffKPIReport.tsx` | Staff performance metrics from Phorest |
| `ClientRetentionReport.tsx` | Client return rate analysis |
| `NoShowReport.tsx` | No-show tracking and patterns |
| `CapacityReport.tsx` | Booking density analysis |

### 3. Report Data Hooks
**Files in** `src/hooks/`:

| Hook | Data Source |
|------|-------------|
| `useStaffKPIReport.ts` | Aggregates `phorest_performance_metrics` |
| `useClientRetentionReport.ts` | Analyzes client visit patterns |
| `useNoShowReport.ts` | Calculates no-show statistics |
| `useCapacityReport.ts` | Booking density from appointments |

---

## UI Design

### Reports Hub Layout

```text
+----------------------------------------------------------+
|  Reports                           [Date Range ▼] [Location ▼]  |
+----------------------------------------------------------+
|                                                          |
|  [Sales] [Staff] [Clients] [Operations] [Financial]      |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  +------------------+  +------------------+               |
|  | Daily Sales      |  | Sales by Stylist |              |
|  | Summary          |  |                  |              |
|  | [Generate] [PDF] |  | [Generate] [PDF] |              |
|  +------------------+  +------------------+               |
|                                                          |
|  +------------------+  +------------------+               |
|  | Product Sales    |  | Service Sales    |              |
|  |                  |  |                  |              |
|  | [Generate] [PDF] |  | [Generate] [PDF] |              |
|  +------------------+  +------------------+               |
|                                                          |
+----------------------------------------------------------+
|  Recent Reports                                          |
|  +----------------------------------------------------+  |
|  | Staff KPI Report - Jan 20-26 - Generated 1h ago   |  |
|  | Daily Sales - Jan 25 - Generated 3h ago           |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
```

### Report Preview Modal

When generating a report, show a preview with:
- Summary statistics at top
- Data table with sortable columns
- Chart visualization (where applicable)
- Export buttons (PDF, CSV, Google Sheets)

---

## Implementation Phases

### Phase 1: Foundation
1. Create `ReportsHub.tsx` page with basic structure
2. Add route at `/dashboard/admin/reports`
3. Build category tabs and report cards
4. Integrate existing `SalesReportPDF` component

### Phase 2: Staff Reports
1. Create `useStaffKPIReport` hook using `phorest_performance_metrics`
2. Build `StaffKPIReport` component with metrics visualization
3. Add PDF generation for staff reports
4. Include rebooking and new client analysis

### Phase 3: Client Reports
1. Create `useClientRetentionReport` hook
2. Build retention analysis with visit frequency charts
3. Add at-risk client identification
4. Include lifetime value calculations

### Phase 4: Operational Reports
1. Create `useNoShowReport` and `useCapacityReport` hooks
2. Build no-show patterns visualization
3. Add capacity utilization charts
4. Include service duration analysis

### Phase 5: Report History & Scheduling
1. Create `report_history` table
2. Build `RecentReports` component
3. Add report download history
4. (Future) Scheduled report generation

---

## Technical Details

### Route Addition
**File:** `src/App.tsx` or router config
```typescript
<Route path="reports" element={<ReportsHub />} />
```

### Navigation Addition
Add "Reports" link to admin sidebar under Analytics section.

### Permission Control
Require `view_reports` permission (create if needed) or use existing `view_sales_analytics`.

### Data Sources
- Primary: Existing database tables (`phorest_performance_metrics`, `phorest_appointments`, `phorest_daily_sales_summary`, `phorest_transaction_items`)
- Enhanced: Trigger additional Phorest syncs when needed for fresh data

---

## Report Export Formats

| Format | Implementation |
|--------|----------------|
| **PDF** | Extend existing `SalesReportPDF` pattern with jsPDF + autoTable |
| **CSV** | Client-side generation using Blob download |
| **Google Sheets** | Leverage existing `GoogleSheetsExport` component |

---

## Summary

This Reports Hub will:
1. Consolidate all existing reporting features
2. Add 10+ new report types based on Phorest data
3. Provide consistent filtering and export options
4. Track report generation history
5. Support PDF, CSV, and Google Sheets exports

The implementation leverages existing Phorest data that's already syncing (appointments, performance metrics, transaction items) while adding new aggregation and visualization capabilities.
