

## Fix Zura AI Data Access for All Analytics Cards

### Problem
Zura says "no specific data provided" on every card because no `metricData` is ever passed. This affects all ~25+ PinnableCard instances across Sales, Operations, Marketing, Clients, Correlations, and the Dashboard.

### Solution
Two-part fix:

1. **Edge function queries the database directly** based on `cardName` -- no need to restructure card components
2. **Pass `dateRange` and `locationName`** from each tab's filter context to PinnableCard

---

### Part 1: Edge Function Database Queries

**File: `supabase/functions/ai-card-analysis/index.ts`**

- Create a Supabase client using `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- When `metricData` is empty/missing, run card-specific queries:

| Card Name Pattern | Tables Queried | Metrics Built |
|---|---|---|
| Sales Overview | `phorest_appointments`, `phorest_transaction_items` | Total revenue, service count, avg ticket, product sales |
| Revenue Trend | `phorest_daily_sales_summary` | Daily revenue totals over period |
| Forecasting / Week Ahead | `phorest_appointments` (future dates) | Upcoming appointment count + projected revenue |
| Location Comparison | `phorest_daily_sales_summary` grouped by location | Revenue per location |
| Product Categories | `phorest_transaction_items` | Revenue by product category |
| Service Popularity | `phorest_appointments` | Count by service type |
| Client Funnel | `phorest_clients`, `phorest_appointments` | New vs returning, rebook rate |
| Appointments Summary | `phorest_appointments` | Total, completed, cancelled, no-show counts |
| Retention Metrics | `phorest_clients`, `phorest_appointments` | Retention rate, at-risk count |
| Marketing KPIs | `marketing_analytics` | Leads, conversions, source breakdown |
| **Fallback** | `phorest_appointments` | Generic recent activity summary |

- Date range parsing: map filter values like "today", "yesterday", "this_week", "this_month", "last_30_days", etc. to actual date ranges
- Location filtering: when `locationName` is provided, filter queries by matching location

### Part 2: Pass Context from Tab Components

Pass `dateRange` and `locationName` props through to every `PinnableCard` in each tab:

**Files to update (6 tab content files):**

1. **`src/components/dashboard/analytics/SalesTabContent.tsx`**
   - Pass `dateRange={filters.dateRange}` and `locationName` to all PinnableCard instances (~7 cards)

2. **`src/components/dashboard/analytics/OperationsTabContent.tsx`**
   - Pass filter context to operations PinnableCards

3. **`src/components/dashboard/analytics/MarketingTabContent.tsx`**
   - Pass filter context to marketing PinnableCards (~6 cards)

4. **`src/components/dashboard/analytics/ClientsContent.tsx`**
   - Pass filter context to retention/client PinnableCards (~4 cards)

5. **`src/components/dashboard/analytics/AppointmentsContent.tsx`**
   - Pass filter context to appointment PinnableCards

6. **`src/components/dashboard/analytics/CorrelationsContent.tsx`**
   - Pass filter context to correlation PinnableCards (~3 cards)

### Pattern Applied to Each Tab

```tsx
// Before
<PinnableCard elementKey="sales_overview" elementName="Sales Overview" category="Analytics Hub - Sales">

// After
<PinnableCard 
  elementKey="sales_overview" 
  elementName="Sales Overview" 
  category="Analytics Hub - Sales"
  dateRange={filters.dateRange}
  locationName={selectedLocationName}
>
```

Each tab already has access to its filter state (date range, location). We just thread it through.

### Files Modified (7 total)
1. `supabase/functions/ai-card-analysis/index.ts` -- add database query logic with card-specific queries and fallback
2. `src/components/dashboard/analytics/SalesTabContent.tsx` -- pass dateRange + locationName to PinnableCards
3. `src/components/dashboard/analytics/OperationsTabContent.tsx` -- pass dateRange + locationName
4. `src/components/dashboard/analytics/MarketingTabContent.tsx` -- pass dateRange + locationName
5. `src/components/dashboard/analytics/ClientsContent.tsx` -- pass dateRange + locationName
6. `src/components/dashboard/analytics/AppointmentsContent.tsx` -- pass dateRange + locationName
7. `src/components/dashboard/analytics/CorrelationsContent.tsx` -- pass dateRange + locationName

