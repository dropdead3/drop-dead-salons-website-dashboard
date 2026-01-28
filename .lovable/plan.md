
# Fix Font on Location Comparison Card Header

## Problem

The filter information badge and total revenue badge in the Location Comparison card header are inheriting the `font-display` (Termina) font from the parent `CardTitle`. They should use the default body font (Aeonin Pro) to match other cards.

---

## Current Code (Line 98-112)

```tsx
<CardTitle className="font-display text-sm flex items-center justify-between">
  <span>LOCATION COMPARISON</span>
  <div className="flex items-center gap-2">
    {filterContext && (
      <AnalyticsFilterBadge ... />
    )}
    <Badge variant="outline" className="font-normal">
      ${totalRevenue.toLocaleString()} total
    </Badge>
  </div>
</CardTitle>
```

The `font-display` class on `CardTitle` applies Termina font to **all children**, including the filter badge and total badge.

---

## Solution

Move `font-display` from the parent `CardTitle` to only the title text span, so the badges use the default body font:

```tsx
<CardTitle className="text-sm flex items-center justify-between">
  <span className="font-display">LOCATION COMPARISON</span>
  <div className="flex items-center gap-2">
    {filterContext && (
      <AnalyticsFilterBadge ... />
    )}
    <Badge variant="outline" className="font-normal">
      ${totalRevenue.toLocaleString()} total
    </Badge>
  </div>
</CardTitle>
```

---

## File to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/sales/LocationComparison.tsx` | Move `font-display` from `CardTitle` to the title `<span>` only |

---

## Result

| Element | Before | After |
|---------|--------|-------|
| "LOCATION COMPARISON" | Termina | Termina (unchanged) |
| Filter badge (location + date) | Termina | Aeonin Pro |
| "$5,446 total" badge | Termina | Aeonin Pro |

This matches the typography pattern used in other analytics cards.
