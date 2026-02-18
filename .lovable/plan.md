

## Add Service Mix Legend to Service Popularity Card

### What Changes
Add a compact Service Mix category summary below the bar chart in the Service Popularity card, using the existing `ServiceMixLegend` component already built for the Forecasting cards.

### How It Works
The Service Popularity chart already has per-service data with `category` fields and `totalRevenue` values. We aggregate these into a `byCategory` record and pass it to `ServiceMixLegend`, which renders colored dots with category names and percentages.

The legend appears unconditionally (both Revenue and Frequency tabs) since the category breakdown is always relevant context when viewing individual service rankings.

### Technical Details

**File: `src/components/dashboard/sales/ServicePopularityChart.tsx`**

1. Import `ServiceMixLegend` from `@/components/dashboard/analytics/ServiceMixLegend`
2. Compute a `byCategory` record from the full `data` array (not just `sortedData`), aggregating `totalRevenue` per category
3. Render `<ServiceMixLegend byCategory={byCategory} />` between the chart tabs and the Stylist Breakdown section

The `byCategory` computation:
```tsx
const byCategory = useMemo(() => {
  const map: Record<string, number> = {};
  data?.forEach(svc => {
    const cat = svc.category || 'Other';
    map[cat] = (map[cat] || 0) + svc.totalRevenue;
  });
  return map;
}, [data]);
```

### Files Modified
- `src/components/dashboard/sales/ServicePopularityChart.tsx` (import + computed value + render)
