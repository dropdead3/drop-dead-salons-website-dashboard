

# Services & Products Drill-Down with Retail-to-Service Ratio

## What You'll Get

Clicking the **Services** tile opens a dialog showing each stylist's service revenue, number of services performed, and their retail-to-service ratio. Clicking the **Products** tile opens a similar dialog showing each stylist's product sales, items sold, and the same retail-to-service ratio. Both follow the same premium dialog pattern already used for the New Bookings drill-down.

## UX Layout

```text
+-----------------------------------------------+
|  [X]                                           |
|  SERVICES BY STYLIST           Yesterday       |
|                                                |
|  +-------------------------------------------+ |
|  |  [Avatar] Sarah M.                        | |
|  |  $620 service revenue · 8 services        | |
|  |  Retail : Service  12%                     | |
|  |  ================================ (bar)    | |
|  +-------------------------------------------+ |
|                                                |
|  +-------------------------------------------+ |
|  |  [Avatar] Jamie L.                        | |
|  |  $380 service revenue · 5 services        | |
|  |  Retail : Service  8%                      | |
|  |  ====================  (bar)              | |
|  +-------------------------------------------+ |
+-----------------------------------------------+
```

The Products variant swaps to show product revenue, quantity sold, and the same ratio (so the user can see which stylists are strong at retail regardless of which tile they click).

## Technical Approach

### 1. New hook: `useServiceProductDrilldown`

A focused hook that queries `phorest_transaction_items` for the selected date range, grouped by `phorest_staff_id` and `item_type`. Returns:

- **By stylist**: service revenue, service count, product revenue, product count, and computed retail-to-service ratio (product revenue / service revenue as a percentage)
- Resolves staff names/photos via the existing `phorest_staff_mapping` + `employee_profiles` join pattern

This uses `phorest_transaction_items` (not appointments) because it has both service and product line items with staff attribution -- giving accurate retail tracking.

### 2. New component: `ServiceProductDrilldown.tsx`

- Reuses the exact same dialog pattern as `NewBookingsDrilldown` (backdrop-blur, max-w-lg, scrollable 70vh content, branded footer)
- Two modes: `'services'` and `'products'`
- **Services mode**: Shows service revenue (large number), service count, and retail:service ratio per stylist
- **Products mode**: Shows product revenue (large number), items sold, and retail:service ratio per stylist
- Progress bar represents each stylist's share of total (services or products)
- Sorted by revenue descending

### 3. Update `AggregateSalesCard.tsx`

- Add `cursor-pointer` and hover states to the Services and Products tiles (lines 516-544)
- Add state: `drilldownMode: 'services' | 'products' | null`
- Render the `ServiceProductDrilldown` dialog conditionally
- Pass the date filters through to the new hook

### 4. Retail-to-Service Ratio Display

Each stylist row shows a subtle "Retail : Service" label with their ratio as a percentage. Color-coded:
- 15%+ = emerald (strong retail performer)
- 8-15% = amber (average)
- Below 8% = red/muted (opportunity for improvement)

This gives owners instant visibility into who is cross-selling effectively.

### Files Created/Modified

| File | Action |
|---|---|
| `src/hooks/useServiceProductDrilldown.ts` | New hook |
| `src/components/dashboard/ServiceProductDrilldown.tsx` | New component |
| `src/components/dashboard/AggregateSalesCard.tsx` | Make tiles clickable |
