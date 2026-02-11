

## Fix Card Header Overflow on Sales Charts

### Problem
The "Product Categories" and "Service Popularity" card headers pack the title, filter badge, and summary badges into a single horizontal row. When card width is constrained (especially in the 2-column grid), content overflows outside the card boundary.

### Solution
Restructure both card headers to wrap cleanly:
- Stack the title row and the badges/filter row vertically instead of forcing everything onto one line
- Move the filter badge and summary badges below the title, aligned right, with `flex-wrap` so they gracefully wrap on small screens

### Visual Result

```text
+------------------------------------------+
| [icon] SERVICE POPULARITY                |
| Most requested services ranked by...     |
|          All Locations . Today  19  $2k  |
+------------------------------------------+
```

Instead of the current single-line layout that overflows.

### Files to Change

**1. `src/components/dashboard/sales/ServicePopularityChart.tsx`** (lines 48-65)
- Change the header from a single `flex justify-between` row to a stacked layout
- Title on its own line
- Filter badge + summary badges on the next line, right-aligned with `flex-wrap`

**2. `src/components/dashboard/sales/ProductCategoryChart.tsx`** (lines 51-67)
- Same restructure: title on top, badges below with `flex-wrap`

### Technical Detail
Both headers currently use:
```tsx
<div className="flex items-center justify-between">
  <div>{icon + title}</div>
  <div>{filterBadge + badges}</div>
</div>
```

Change to:
```tsx
<div className="flex items-start justify-between gap-2">
  <div className="flex items-center gap-2 min-w-0">
    {icon + title}
  </div>
  <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
    {filterBadge + badges}
  </div>
</div>
```

Key fixes:
- `min-w-0` on the title side allows it to shrink
- `flex-wrap justify-end` on the badges side lets them wrap to a second line
- `items-start` instead of `items-center` so wrapped content aligns cleanly
- `shrink-0` is removed if badges should also shrink; or we allow the badge group to wrap

This is a CSS-only fix -- no logic changes needed.
