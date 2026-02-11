

# Fix Services Drill-Down: Query Appointments Instead of Empty Transaction Items

## Problem

The `useServiceProductDrilldown` hook queries `phorest_transaction_items`, which has **0 rows**. Your actual service data lives in `phorest_appointments` (321 records with service names, staff IDs, and prices from the Phorest scheduling API).

## Fix

### Rewrite `useServiceProductDrilldown.ts`

Change the data source from `phorest_transaction_items` to `phorest_appointments`:

- Query `phorest_appointments` filtered by date range, location, and excluding cancelled/no-show statuses
- Group by `phorest_staff_id` to compute: service revenue (`SUM(total_price)`), service count, and each stylist's share of total
- Resolve staff names via the existing `phorest_staff_mapping` + `employee_profiles` join
- For the **products** mode: since product sales aren't tracked in appointments (only in the empty transaction items table), the products drill-down will display a clear message: "Product sales data requires transaction sync" until that pipeline is operational
- The retail-to-service ratio will be omitted for now (requires product data), replaced with a simpler "share of total services" metric

### Update `ServiceProductDrilldown.tsx`

- Adjust the UI to handle the case where product data is unavailable
- When in services mode: show service revenue, service count, and share of total per stylist (all data available from appointments)
- When in products mode: show an informative empty state explaining product tracking requires the transaction data sync

### No changes to `AggregateSalesCard.tsx`

The click handlers and state management are already correct -- only the data source needs to change.

## Why This Is the Right Approach

The Phorest scheduling API reliably provides service-level data through appointments. The CSV Export Job (which would populate `phorest_transaction_items` with both service and product line items) has not successfully loaded data. Rather than waiting for that pipeline, we use the data that is already available and working.

Once the transaction items sync is operational in the future, the hook can be extended to pull product data from that table to enable the full retail-to-service ratio and product drill-down.
