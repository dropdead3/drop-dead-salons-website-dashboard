

# Make Widgets Fill Remaining Row Space

## The Problem
With `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`, the grid always creates that many columns. When the last row has fewer widgets than columns, the widgets stay at their fixed column width and empty space remains.

## The Fix: CSS Grid `auto-fit` with `minmax`

### File: `src/components/dashboard/WidgetsSection.tsx`

Replace the Tailwind grid classes with an inline `auto-fit` grid:

**Before:**
```tsx
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

**After:**
```tsx
<div
  className="grid gap-4"
  style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
>
```

### How it works
- `auto-fit` creates as many columns as fit, then **collapses empty tracks** so remaining items stretch to fill the row
- `minmax(280px, 1fr)` means each widget is at least 280px wide but grows to share available space equally
- On narrow screens, widgets naturally stack to 1 column (since 2 x 280px won't fit)
- On wide screens, up to 4+ columns form automatically
- **Crucially**: a last row with 2 widgets in a 3-column layout will have those 2 widgets expand to fill the full width -- no dead space

### Result by viewport
- ~560px and below: 1 column
- ~560-840px: 2 columns
- ~840-1120px: 3 columns
- ~1120px+: 4 columns
- Partial last rows always stretch to fill

| File | Change |
|---|---|
| `src/components/dashboard/WidgetsSection.tsx` | Replace Tailwind grid-cols classes with `auto-fit` + `minmax` inline style |

