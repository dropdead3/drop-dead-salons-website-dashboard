

## Apply Matching Header Padding to Revenue Breakdown Card

### Change

**File: `src/components/dashboard/sales/RevenueDonutChart.tsx`**

Update both `CardHeader` instances (empty state and populated state) from:
```
className="px-4 py-2 pb-1"
```
to:
```
className="px-4 pt-4 pb-1"
```

This matches the fix already applied to the Top Performers card, ensuring consistent 16px top padding across both sidebar cards.

