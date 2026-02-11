

## Fix Overlapping Card Headers -- Stack Title and Badges Vertically

### Problem
The title text ("PRODUCT CATEGORIES", "SERVICE POPULARITY") and filter/summary badges ("All Locations · Today", "19 services", "$2,021") are fighting for the same horizontal row. Even with `flex-wrap`, the title font is too large and the badges too wide -- they overlap visually.

### Solution
Stop trying to fit everything on one line. Instead, stack vertically:
1. Title row: icon + title (full width)
2. Badges row: filter badge + summary badges, right-aligned on their own line

```text
+------------------------------------------+
| [icon] Product Categories                |
|          All Locations · Today     $0    |
| Revenue breakdown by product category    |
+------------------------------------------+
```

### Changes

**1. `src/components/dashboard/sales/ProductCategoryChart.tsx`** (lines 52-66)

Replace the single `flex justify-between` wrapper with a vertical stack:

```tsx
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <ShoppingBag className="w-5 h-5 text-chart-2 shrink-0" />
    <CardTitle className="font-display">Product Categories</CardTitle>
  </div>
  <div className="flex items-center gap-2 flex-wrap">
    {filterContext && <AnalyticsFilterBadge ... />}
    <Badge variant="outline">$0</Badge>
  </div>
</div>
```

**2. `src/components/dashboard/sales/ServicePopularityChart.tsx`** (lines 49-64)

Same restructure:

```tsx
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <Scissors className="w-5 h-5 text-primary shrink-0" />
    <CardTitle className="font-display">Service Popularity</CardTitle>
  </div>
  <div className="flex items-center gap-2 flex-wrap">
    {filterContext && <AnalyticsFilterBadge ... />}
    <Badge variant="outline">{totalServices} services</Badge>
    <Badge variant="secondary">${totalRevenue}</Badge>
  </div>
</div>
```

### What This Fixes
- Title gets its own full-width line -- no more overlap with badges
- Badges wrap naturally on their own row
- Clean, readable hierarchy: Title > Filters/Stats > Description
- Works at any card width without spilling

### Files Modified
1. `src/components/dashboard/sales/ProductCategoryChart.tsx` -- vertical stack header
2. `src/components/dashboard/sales/ServicePopularityChart.tsx` -- vertical stack header
