

# Fix Font on Location Comparison Card Header

## Problem

The filter information badge ("ALL LOCAT... · TODAY") and total revenue badge ("$1,896 TOTAL") are using **Termina** (font-display) when they should use **Aeonik Pro** (default body font) to match other cards.

---

## Root Cause

In `src/components/dashboard/sales/LocationComparison.tsx`, the `font-display` class is on the parent `CardTitle`, causing all children to inherit Termina:

```tsx
<CardTitle className="font-display text-sm flex items-center justify-between">
  <span>LOCATION COMPARISON</span>
  <div className="flex items-center gap-2">
    {filterContext && <AnalyticsFilterBadge ... />}
    <Badge ...>$1,896 total</Badge>
  </div>
</CardTitle>
```

---

## Solution

Move `font-display` from the parent `CardTitle` to only the title text `<span>`:

```tsx
<CardTitle className="text-sm flex items-center justify-between">
  <span className="font-display">LOCATION COMPARISON</span>
  <div className="flex items-center gap-2">
    {filterContext && <AnalyticsFilterBadge ... />}
    <Badge ...>$1,896 total</Badge>
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
| "LOCATION COMPARISON" title | Termina | Termina (unchanged) |
| Filter badge (ALL LOCAT... · TODAY) | Termina | Aeonik Pro |
| "$1,896 TOTAL" badge | Termina | Aeonik Pro |

