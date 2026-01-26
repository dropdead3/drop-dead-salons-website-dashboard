
# Phorest CSV Export Job Implementation Plan

## Current State Analysis

### What's Working
- Appointments sync is successful (40+ appointments synced with total_price data)
- Performance reports sync is working
- Staff and client syncs are functional

### What's NOT Working
- **Sales sync consistently returns 0 records** despite hourly attempts
- The `phorest_sales_transactions` table is completely empty
- All 4 fallback endpoints are failing: `/transaction`, `/sale`, CSV export job, `/report/sales`
- Current workaround: Revenue is calculated from `phorest_appointments.total_price` (~80-90% accuracy, excludes retail products)

### Root Cause Investigation
The CSV export job implementation (lines 908-1026) has several potential issues:
1. **Job type may be incorrect**: Using `TRANSACTIONS_CSV` - Phorest may use a different identifier
2. **Endpoint path may need adjustment**: Currently using `/branch/{branchId}/csvexportjob`
3. **Missing proper error handling**: Silent failures don't surface which step fails
4. **No detailed logging**: Hard to debug without seeing API responses

---

## Phase 1: Fix CSV Export Job Implementation

### 1.1 Update Edge Function with Correct API Pattern

Based on the Phorest API documentation reference, update `fetchSalesViaCsvExport`:

```text
Changes to supabase/functions/sync-phorest-data/index.ts:

1. Update jobType to match Phorest API:
   - Try "TRANSACTION" instead of "TRANSACTIONS_CSV"
   - Add fallback job types: "SALES", "PURCHASES"

2. Correct the endpoint structure:
   - Per Phorest docs: POST /business/{businessId}/branch/{branchId}/csvexportjob
   - Add required fields: jobType, startDate, endDate

3. Add comprehensive logging:
   - Log full request/response for debugging
   - Log each step of the job creation/polling/download process

4. Improve error handling:
   - Catch and log specific error types
   - Add retry logic for transient failures
```

### 1.2 Enhanced CSV Export Function

```text
New fetchSalesViaCsvExport implementation:

Step 1 - Create Export Job:
  POST /branch/{branchId}/csvexportjob
  Body: {
    jobType: "TRANSACTION",  // or "SALES" - test both
    startDate: "2026-01-01",
    endDate: "2026-01-26"
  }
  
Step 2 - Poll for Completion:
  GET /branch/{branchId}/csvexportjob/{jobId}
  - Wait for status: "COMPLETED" or "DONE"
  - Max attempts: 60 (2 min total with 2s intervals)
  - Log each status check
  
Step 3 - Download CSV:
  GET /branch/{branchId}/csvexportjob/{jobId}/download
  - Accept header: "text/csv"
  - Log first 500 chars of response for debugging
  
Step 4 - Parse CSV:
  - Handle various column name formats from Phorest
  - Extract: client names, products/services, staff, amounts
```

### 1.3 Improved CSV Parser

Update `parseSalesCsv` to handle more column variations:

| Expected Column | Possible Phorest Names |
|-----------------|------------------------|
| Transaction ID | transaction_id, id, sale_id, purchase_id |
| Client Name | client_name, customer_name, client |
| Staff ID | staff_id, employee_id, therapist_id |
| Item Name | item_name, service_name, product_name |
| Item Type | type, item_type, category |
| Amount | amount, total, price, revenue |
| Date | date, transaction_date, sale_date |

---

## Phase 2: Robust Sales Sync Architecture

### 2.1 New Sync Strategy with Prioritized Fallbacks

```text
Primary: CSV Export Job (most complete data)
   |
   v (if fails after 3 retries)
Fallback 1: Aggregate from phorest_appointments
   |
   v (always run as supplement)
Fallback 2: /report/staff-performance (weekly summaries)
```

### 2.2 Database Schema Enhancement

Add new table for detailed transaction items:

```sql
-- Store itemized transaction details from CSV
CREATE TABLE phorest_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL,
  phorest_staff_id TEXT,
  stylist_user_id UUID REFERENCES employee_profiles(user_id),
  phorest_client_id TEXT,
  client_name TEXT,
  location_id TEXT,
  branch_name TEXT,
  transaction_date DATE NOT NULL,
  item_type TEXT NOT NULL, -- 'service', 'product', 'voucher'
  item_name TEXT NOT NULL,
  item_category TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(10,2),
  discount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(transaction_id, item_name, item_type)
);

-- Enable RLS
ALTER TABLE phorest_transaction_items ENABLE ROW LEVEL SECURITY;

-- Index for common queries
CREATE INDEX idx_transaction_items_date ON phorest_transaction_items(transaction_date);
CREATE INDEX idx_transaction_items_staff ON phorest_transaction_items(phorest_staff_id);
```

### 2.3 Add Dedicated Sync Logging

```sql
-- Enhanced sync metadata
ALTER TABLE phorest_sync_log ADD COLUMN IF NOT EXISTS 
  api_endpoint TEXT,
  response_sample TEXT,
  retry_count INTEGER DEFAULT 0;
```

---

## Phase 3: New Analytics Features

### 3.1 Client Transaction History

**New Hook**: `useClientTransactionHistory`
- Fetch all transactions for a specific client
- Show services, products, spend over time
- Track preferred stylist relationships

**New Component**: `ClientSpendChart`
- Visualize client spending patterns
- Product vs. service split
- Visit frequency trends

### 3.2 Product Sales Analytics

**New Hook**: `useProductSalesAnalytics`
- Top-selling products by revenue
- Product category breakdown
- Staff product sales performance

**New Component**: `ProductLeaderboard`
- Rank products by sales volume
- Filter by location, date range
- Compare periods (MoM, YoY)

### 3.3 Enhanced Staff Revenue Breakdown

**Update**: `useStaffRevenuePerformance`
- Add retail product revenue (currently missing)
- Track service vs. product ratio per staff
- Calculate retail attachment rate

**New Metric Cards**:
- "Retail Attachment Rate" - % of service transactions with product sales
- "Product Revenue per Client" - Average product spend
- "Top Product Sellers" - Staff ranked by retail sales

### 3.4 Transaction-Level Reporting

**New Page**: `/dashboard/admin/transactions`
- Full transaction list with filters
- Export to PDF/CSV
- Drill-down to transaction details

**Features**:
- Filter by: date, staff, client, item type, location
- Sort by: date, amount, client name
- Group by: day, staff, client

---

## Implementation Order

| Step | Task | Estimated Impact |
|------|------|------------------|
| 1 | Fix CSV export job (correct job type, logging) | Critical - enables all other features |
| 2 | Add retry logic and enhanced error handling | High - improves reliability |
| 3 | Create phorest_transaction_items table | Medium - stores detailed data |
| 4 | Update sync to populate new table | Medium - data flow |
| 5 | Build product sales analytics | Medium - new insights |
| 6 | Add client transaction history | Medium - client retention insights |
| 7 | Create transactions admin page | Low - operational visibility |

---

## Technical Details

### Files to Modify

1. **supabase/functions/sync-phorest-data/index.ts**
   - Lines 908-1049: Rewrite `fetchSalesViaCsvExport`
   - Lines 632-906: Update `syncSalesTransactions` to use new strategy
   - Add detailed logging throughout

2. **New Database Migration**
   - Create `phorest_transaction_items` table
   - Add RLS policies
   - Create indexes

3. **New Hooks**
   - `src/hooks/useClientTransactionHistory.ts`
   - `src/hooks/useProductSalesAnalytics.ts`
   - Update `src/hooks/useStaffRevenuePerformance.ts`

4. **New Components**
   - `src/components/dashboard/analytics/ProductLeaderboard.tsx`
   - `src/components/dashboard/analytics/ClientSpendChart.tsx`
   - `src/components/dashboard/sales/TransactionsList.tsx`

5. **New Page**
   - `src/pages/dashboard/admin/TransactionsPage.tsx`

### Testing Strategy

1. **Manual test CSV export**:
   - Trigger sync with verbose logging
   - Verify each step completes
   - Check CSV content structure

2. **Verify data integrity**:
   - Compare CSV totals with appointment revenue
   - Validate staff mappings
   - Check date range coverage

3. **Monitor sync health**:
   - Check sync logs for success/failure patterns
   - Set up alerts for consecutive failures
