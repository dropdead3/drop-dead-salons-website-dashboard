
## Sort Stacked Bar Segments by Revenue (Largest to Smallest)

### What Changes

The stacked bar segments will be ordered from largest revenue contribution (bottom of stack) to smallest (top of stack), instead of the current alphabetical order. This makes the dominant service categories visually prominent at the base of every bar.

**Important note:** Recharts renders stacked bars in a fixed order across all bars in the chart. Per-bar reordering is not possible with stacked `<Bar>` components. The sort will be based on **total revenue across all days/weeks**, so the category that generates the most overall revenue sits at the bottom of every stack.

### Changes

**`src/components/dashboard/sales/WeekAheadForecast.tsx`** (line ~180)
- Replace `.sort()` with a sort by total revenue descending:
```typescript
const allCategories = useMemo(() => {
  const catTotals: Record<string, number> = {};
  days.forEach(day => {
    Object.entries(day.categoryBreakdown).forEach(([c, v]) => {
      catTotals[c] = (catTotals[c] || 0) + v;
    });
  });
  return Object.entries(catTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([cat]) => cat);
}, [days]);
```

**`src/components/dashboard/sales/ForecastingCard.tsx`** (line ~431)
- Same logic, using the appropriate source (days or weeks):
```typescript
const allCategories = useMemo(() => {
  const catTotals: Record<string, number> = {};
  const source = showWeeklyChart ? weeks : days;
  source.forEach((item: any) => {
    Object.entries(item.categoryBreakdown || {}).forEach(([c, v]) => {
      catTotals[c] = (catTotals[c] || 0) + (v as number);
    });
  });
  return Object.entries(catTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([cat]) => cat);
}, [days, weeks, showWeeklyChart]);
```

### Result
- Bottom of stack = highest revenue category (e.g., "Blonding" or "Color")
- Top of stack = smallest category
- The topmost bar segment keeps its rounded corners and label
- Tooltip category list also inherits this order naturally since it reads from `_categoryBreakdown` sorted by value

### Files Modified
- `src/components/dashboard/sales/WeekAheadForecast.tsx` (1 line block)
- `src/components/dashboard/sales/ForecastingCard.tsx` (1 line block)
