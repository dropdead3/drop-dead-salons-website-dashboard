

# Fix Empty Product Categories and Service Popularity Charts

## Problem

Both charts show "No data available" because they query the `phorest_sales_transactions` table, which is **empty**. However, service data IS available in `phorest_appointments` (101 records with service names and prices).

| Table | Status |
|-------|--------|
| `phorest_sales_transactions` | Empty (sales sync not populating) |
| `phorest_appointments` | 101 records with service data |

---

## Root Cause

The hooks in `useSalesAnalytics.ts` query `phorest_sales_transactions`:

```tsx
// useProductCategoryBreakdown - queries empty table
.from('phorest_sales_transactions')
.eq('item_type', 'product')

// useServicePopularity - queries empty table  
.from('phorest_sales_transactions')
.eq('item_type', 'service')
```

---

## Solution

Update the hooks to use available data sources:

### 1. Service Popularity - Use `phorest_appointments`

The appointments table has service names and prices. Update `useServicePopularity` to query this table instead:

```tsx
// Before: queries empty table
.from('phorest_sales_transactions')
.eq('item_type', 'service')

// After: use appointments data
.from('phorest_appointments')
.not('service_name', 'is', null)
.not('total_price', 'is', null)
```

Then aggregate by `service_name` instead of `item_name`.

### 2. Product Categories - Show Helpful Message

Since product sales require the CSV export sync (which populates `phorest_sales_transactions`), and that data isn't available yet, update the empty state to explain why:

```text
"Product sales data requires sales sync. 
Use the refresh button to sync Phorest sales data."
```

Alternatively, we could add a fallback query to `phorest_appointments` looking for product-related services, but appointments typically don't include retail product sales.

---

## Implementation

### File: `src/hooks/useSalesAnalytics.ts`

**Change `useServicePopularity`** to query `phorest_appointments`:

```tsx
export function useServicePopularity(dateFrom?: string, dateTo?: string, locationId?: string) {
  return useQuery({
    queryKey: ['service-popularity', dateFrom, dateTo, locationId],
    queryFn: async () => {
      let query = supabase
        .from('phorest_appointments')
        .select('service_name, total_price, location_id')
        .not('service_name', 'is', null)
        .not('total_price', 'is', null);

      if (dateFrom) query = query.gte('appointment_date', dateFrom);
      if (dateTo) query = query.lte('appointment_date', dateTo);
      if (locationId) query = query.eq('location_id', locationId);

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by service name
      const byService: Record<string, ServicePopularityData> = {};
      data?.forEach(row => {
        const name = row.service_name;
        if (!byService[name]) {
          byService[name] = {
            name,
            category: null, // appointments don't have category
            frequency: 0,
            totalRevenue: 0,
            avgPrice: 0,
          };
        }
        byService[name].frequency += 1;
        byService[name].totalRevenue += Number(row.total_price) || 0;
      });

      // Calculate averages
      Object.values(byService).forEach(svc => {
        svc.avgPrice = svc.frequency > 0 ? svc.totalRevenue / svc.frequency : 0;
      });

      return Object.values(byService).sort((a, b) => b.frequency - a.frequency);
    },
    enabled: !!dateFrom && !!dateTo,
  });
}
```

### File: `src/components/dashboard/sales/ProductCategoryChart.tsx`

Update empty state message to be more informative:

```tsx
{topCategories.length === 0 ? (
  <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground gap-2">
    <ShoppingBag className="w-8 h-8 opacity-50" />
    <p className="text-center">
      No product sales data available
      <br />
      <span className="text-xs">Product data syncs from Phorest sales transactions</span>
    </p>
  </div>
) : (
  // chart content
)}
```

---

## Result After Fix

| Chart | Before | After |
|-------|--------|-------|
| Service Popularity | Empty (queried wrong table) | Shows 30+ services from appointments |
| Product Categories | Empty (no product data) | Shows helpful message about sync |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useSalesAnalytics.ts` | Update `useServicePopularity` to query `phorest_appointments` |
| `src/components/dashboard/sales/ProductCategoryChart.tsx` | Improve empty state message |

