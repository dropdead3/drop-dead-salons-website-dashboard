

# Add Granular Revenue Visibility Controls for Management Roles

## Overview

Enhance the visibility system by wrapping additional revenue-sensitive components in `VisibilityGate` so they can be hidden from management roles. The Role Access Configurator already supports this, but some revenue components are not yet gated.

---

## Current Capabilities (Already Working)

These elements are already controllable via Settings > Access & Visibility > Role Access:

| Element Key | Name | Category |
|-------------|------|----------|
| `analytics_sales_tab` | Sales | Page Tabs |
| `analytics_rent_tab` | Rent | Page Tabs |
| `sales_commission_subtab` | Commission | Page Tabs |
| `reports_sales_subtab` | Sales Reports | Page Tabs |
| `reports_financial_subtab` | Financial Reports | Page Tabs |
| `revenue_trend_chart` | Revenue Trend | Analytics Hub - Sales |
| `revenue_forecast` | Revenue Forecast | Analytics Hub - Sales |
| `commission_tiers` | Commission Tiers | Analytics Hub - Sales |

To hide sales/revenue from managers now, you can go to:
**Settings > Access & Visibility > Role Access > Select "Manager" > Page Tabs panel**

Then toggle off:
- Sales (hides entire Sales tab)
- Rent (hides entire Rent tab)
- Commission (hides commission sub-tab)
- Financial Reports (hides financial reports section)

---

## Changes: Add Missing Visibility Controls

The following components need `VisibilityGate` wrappers to enable granular control:

### 1. Rent Revenue Tab Cards

**File: `src/components/dashboard/analytics/RentRevenueTab.tsx`**

Wrap each summary card and chart with visibility controls:

| New Element Key | Name | What It Controls |
|-----------------|------|------------------|
| `rent_mtd_collected` | MTD Rent Collected | Monthly rent collection amount |
| `rent_collection_rate` | Collection Rate | Rent collection percentage |
| `rent_overdue` | Overdue Rent | Overdue amounts and counts |
| `rent_active_renters` | Active Renters | Renter count and late fees |
| `rent_revenue_chart` | Rent Revenue Trend | Historical rent chart |
| `rent_ytd_summary` | YTD Rent Summary | Year-to-date rent totals |

### 2. Reports Tab - Financial Reports

**File: `src/components/dashboard/analytics/ReportsTabContent.tsx`**

Wrap individual financial report cards:

| New Element Key | Name | What It Controls |
|-----------------|------|------------------|
| `report_commission` | Commission Report | Staff earnings calculations |
| `report_revenue_trend` | Revenue Trend Report | Daily/weekly/monthly trends |
| `report_yoy` | Year-over-Year Report | Historical comparison |

---

## Implementation Details

### RentRevenueTab.tsx Changes

```tsx
// Import VisibilityGate
import { VisibilityGate } from '@/components/visibility/VisibilityGate';

// Wrap each card
<VisibilityGate 
  elementKey="rent_mtd_collected" 
  elementName="MTD Rent Collected" 
  elementCategory="Analytics Hub - Rent"
>
  <Card>
    {/* MTD Collected content */}
  </Card>
</VisibilityGate>
```

### ReportsTabContent.tsx Changes

Wrap individual report cards in the financial category:

```tsx
const financialReports = [
  { id: 'revenue-trend', visibilityKey: 'report_revenue_trend', ... },
  { id: 'commission', visibilityKey: 'report_commission', ... },
  ...
];

// In renderReportCards, wrap each card:
<VisibilityGate 
  elementKey={report.visibilityKey || `report_${report.id}`}
  elementName={report.name}
  elementCategory="Reports"
>
  <ReportCard ... />
</VisibilityGate>
```

---

## File Summary

| File | Action |
|------|--------|
| `src/components/dashboard/analytics/RentRevenueTab.tsx` | Wrap 6 cards/sections with VisibilityGate |
| `src/components/dashboard/analytics/ReportsTabContent.tsx` | Add visibility keys to financial report cards |

---

## Usage After Implementation

To hide all revenue/financial data from managers:

1. Go to **Settings > Access & Visibility > Role Access**
2. Select **Manager** role
3. In **Page Tabs** panel:
   - Toggle OFF: `Sales`, `Rent`, `Commission`, `Financial Reports`
4. In **Widgets** panel (after implementation):
   - Toggle OFF: All items under "Analytics Hub - Rent" category

This gives you full control over which revenue-related data each role can see.

---

## Testing Steps

1. Navigate to Settings > Access & Visibility > Role Access
2. Select the "Manager" role
3. Go to "Page Tabs" panel
4. Toggle OFF the "Sales" tab trigger
5. Log in as a Manager user and verify the Sales tab is hidden in Analytics Hub
6. Repeat for Rent, Commission, and Financial Reports tabs

