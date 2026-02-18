

# Retail Analytics Tab -- Gap Analysis and Enhancement Plan

## Current State Summary

The retail tab renders 12 sections: KPI row, Product Performance table, Red Flags, Category Breakdown, Brand Performance, Dead Stock, Inventory Turnover, Product Revenue Trend, Staff Retail Performance, Margin Analysis, Service-Driven Retail, Retail Goal Tracker, Inventory Alerts, and Retail Commissions. Data is seeded (8 products, goal, commission config) but no actual sales exist yet, so most cards show zeros or empty states.

---

## 1. Design Inconsistencies (vs. CARD_HEADER_DESIGN_RULES.md)

| Card | Issue | Rule Violated |
|------|-------|---------------|
| **Inventory Turnover** | Header uses single-column layout (no `justify-between`), no right column, no `CardDescription`, icon container uses `bg-muted` (correct) but title + tooltip sit in same flex div as icon -- missing the nested `<div>` for title/description stacking | Rules 1, 3 |
| **Product Performance** | Header uses `flex items-center gap-3` but search + export are inside the same flex row as title -- no `justify-between` wrapper separating left (icon+title) from right (search+export) | Rule 1 |
| **Product Revenue Trend** | Single-column header, no right column, no `CardDescription` | Rule 1 |
| **Staff Retail Performance** | Same as Product Performance -- search+export inline with title, not in a separate right column | Rule 1 |
| **Margin Analysis** | Single-column header, no right column, no `CardDescription`, no export button | Rules 1, 5 |
| **Category Breakdown** | Missing `CardDescription` in the left column | Rule 3 |
| **Dead Stock** icon container | Uses `bg-amber-500/10` instead of standard `bg-muted` | Rule 2 |
| **Inventory Alerts** icon container | Uses `bg-amber-500/10` instead of `bg-muted` | Rule 2 |
| **Multiple cards** | Missing `AnalyticsFilterBadge` in right column -- only "Service-Driven Retail" has it | Rule 4 |
| **Retail Goal Tracker** icon container | Uses `bg-muted` (correct) but the Zura pin badge `Z` overlaps awkwardly on screen | Visual |

## 2. Missing AnalyticsFilterBadge

Per design rules, the filter badge belongs in the right column of the **first** card. Currently only "Service-Driven Retail" renders it. Every major card should include `<AnalyticsFilterBadge>` or the top-level KPI row should carry it, making the active filter state visible without scrolling.

**Fix**: Add `AnalyticsFilterBadge` to the KPI summary row area and the first analytics card (Product Performance).

## 3. Functional Gaps

### 3a. All data shows $0 / 0 units
- The date picker is set to "Today" but seeded products have no transaction data. Cards appear but show empty. There is no guidance prompting the user to widen the date range or record a sale.
- **Enhancement**: Add contextual empty states like "No sales recorded today. Try a wider date range or record a retail sale" with a CTA link.

### 3b. Inventory Alerts severity mislabeling
- "Smoothing Serum 3oz" has **0 stock** and shows as **critical** (correct), but the other 3 items all show "info" severity. According to `calculateInventoryAlerts`, items with stock > 0 and `daysUntilStockout = 999` (velocity = 0) get "info." This is misleading -- zero velocity with stock below reorder level should at minimum be "warning."
- **Fix**: Adjust severity logic: if `currentStock < reorderLevel` and velocity is 0, default to "warning" not "info."

### 3c. Velocity is always 0.0/day
- `salesVelocity` is calculated from `useRetailAnalytics` based on actual sales in the period. Since there are no sales, velocity is 0 for everything. The "Stockout In" column shows "N/A" for all items.
- **Enhancement**: When velocity is 0 and stock is below reorder level, show "No recent sales" instead of "N/A" to be more informative.

### 3d. Retail Commissions card is missing
- Despite seeding a commission config, the Commissions card is not visible. The card renders only when `staffCommissions.length > 0`, which requires `data.staffRetail` to have entries with `productRevenue > 0`. Since there are no sales, no commissions calculate.
- **Enhancement**: Show the commission card in a "configured but no data" state with the commission structure displayed, so owners can verify their setup.

### 3e. No location filter applied to Inventory Alerts
- `calculateInventoryAlerts` uses `allProducts` from `useProducts({})` which fetches all products globally. When a location filter is active, the alerts should respect it.
- **Fix**: Pass `locationId` to `useProducts` or filter client-side.

### 3f. Dead Stock shows all seeded products
- All 8 seeded products appear as dead stock because none have been sold. This is technically correct but creates noise. Products added to catalog within the last 7 days should be excluded or flagged as "New -- not yet stale."
- **Enhancement**: Add a "new product" grace period (e.g., 7 days from `created_at`) before classifying as dead stock.

### 3g. Margin Analysis shows 0% / $0
- Products have `cost_price` set but since there are no sales, margin analysis is empty. The card still renders with "0.0%" and an empty table.
- **Enhancement**: Show a meaningful empty state: "No sales with cost data in this period" rather than displaying zero metrics.

## 4. Missing Features / Drill-downs

### 4a. No product-level drill-down from Product Performance table
- Clicking a product row does nothing. Users should be able to expand a row to see: daily sales chart, transaction history, margin detail, stock level, and which stylist sold it most.

### 4b. No staff drill-down from Staff Retail Performance
- Clicking a staff row does nothing. Users should be able to expand to see: products they sold, daily revenue trend, commission earned, and top clients served.

### 4c. Category Breakdown has no drill-down
- No expandable rows to see products within each category. The Brand Performance card has this pattern -- Category should match.

### 4d. No "Reorder Queue" management UI
- The `inventory_reorder_queue` table exists and `useReorderQueue` hook is built, but there is no UI to manage the reorder queue (mark items as ordered, received, dismissed). The Inventory Alerts card only shows alerts, not actionable queue management.
- **Enhancement**: Add action buttons to each alert row (Order, Dismiss) or a dedicated reorder queue management section.

### 4e. No commission configuration UI on the analytics page
- The "Configure" button links to Settings, but there is no inline preview of the commission structure (tiers, overrides) on the analytics card itself.

### 4f. Goal Tracker lacks location-level breakdown
- The existing Goal Tracker card in the general analytics (`goal-tracker-card` memory) has location scoreboard and drill-downs. The retail-specific goal tracker is simpler -- it only shows org-level progress with no per-location breakdown.
- **Enhancement**: Add location-level retail goal rows if location-specific goals exist.

### 4g. No "Top Clients by Retail Spend" card
- Staff performance is tracked but client-side retail analytics is completely absent. Understanding which clients buy the most products is a high-value insight for retention.

### 4h. No Export on Inventory Alerts or Commissions
- Brand Performance, Product Performance, Dead Stock, Category, and Staff cards have CSV export. Inventory Alerts and Commissions do not.

## 5. UX / Copy Issues

| Issue | Location | Fix |
|-------|----------|-----|
| "Behind pace" uses emoji warning triangle (unicode) | Goal Tracker | Replace with Lucide `AlertTriangle` icon for consistency |
| "On track" uses checkmark emoji | Goal Tracker | Replace with Lucide `CheckCircle` icon |
| Lever Recommendation copy is generic | Goal Tracker | Make dynamic: reference the highest-attachment service or best-selling product |
| "1d" badge for Days Stale on all dead stock | Dead Stock table | Products created today showing "1d" stale is misleading -- add new product exemption |
| KPI cards show "--" for change when no prior data | KPI row | Show "No prior data" tooltip on hover instead of bare dashes |
| Inventory Alerts description says "1 critical, 0 warning" | Alerts card | Actually shows 1 critical + 3 info. The description omits "info" count |

## 6. Recommended Implementation Priority

### Phase A -- Design Compliance (quick fixes)
1. Standardize all card headers to two-column `justify-between` layout
2. Replace custom icon container colors with `bg-muted`
3. Add `AnalyticsFilterBadge` to KPI area and Product Performance card
4. Add `CardDescription` to cards missing it
5. Add CSV export to Inventory Alerts and Commissions cards

### Phase B -- Empty State and Data Quality
6. Add contextual empty states with CTAs across all cards
7. Fix severity logic for zero-velocity low-stock items (info -> warning)
8. Add new-product grace period for dead stock classification
9. Show commission config preview even with no sales data
10. Fix Margin Analysis to show helpful empty state instead of zeros

### Phase C -- Drill-downs
11. Add expandable product rows in Product Performance (daily trend, staff breakdown, stock)
12. Add expandable staff rows (products sold, trend, commission)
13. Add expandable category rows (matching brand drill-down pattern)
14. Add location-level breakdown to Retail Goal Tracker

### Phase D -- New Features
15. Reorder Queue management UI (Order/Dismiss actions on alert rows)
16. Top Clients by Retail Spend card
17. Location-aware inventory alerts (respect active location filter)
18. Richer lever recommendations in Goal Tracker (reference specific products/services)

---

## Technical Details

### Header Fix Pattern (example for Inventory Turnover)
```tsx
// Before (non-compliant):
<CardHeader className="pb-3">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-muted ..."><Package .../></div>
    <div className="flex items-center gap-2">
      <CardTitle ...>INVENTORY TURNOVER BY BRAND</CardTitle>
      <MetricInfoTooltip .../>
    </div>
  </div>
</CardHeader>

// After (compliant):
<CardHeader className="pb-3">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-muted ..."><Package .../></div>
      <div>
        <div className="flex items-center gap-2">
          <CardTitle ...>INVENTORY TURNOVER BY BRAND</CardTitle>
          <MetricInfoTooltip .../>
        </div>
        <CardDescription>Sell-through velocity per brand</CardDescription>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {filterContext && <AnalyticsFilterBadge .../>}
    </div>
  </div>
</CardHeader>
```

### Severity Logic Fix
```typescript
// In calculateInventoryAlerts:
const severity: InventoryAlert['severity'] =
  (p.quantity_on_hand || 0) === 0 ? 'critical' :
  daysUntilStockout <= 7 ? 'critical' :
  daysUntilStockout <= 14 ? 'warning' :
  // NEW: below reorder with no velocity = warning, not info
  (velocity === 0 && (p.quantity_on_hand || 0) < (p.reorder_level || 0)) ? 'warning' :
  'info';
```

### Product Row Drill-down Pattern
Reuse the same expandable `<TableRow>` pattern from Brand Performance -- click row to toggle a detail panel showing daily sparkline (larger), staff who sold it, margin detail, and current stock level.

