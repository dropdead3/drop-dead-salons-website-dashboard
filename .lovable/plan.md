

# Make Widgets Grid Fully Responsive

## The Problem
The widgets grid currently uses an inline `gridTemplateColumns` style calculated from the number of enabled widgets. This creates a fixed column count that never reflows — on narrow screens, 4 widgets stay in 4 tiny columns instead of wrapping into rows.

## The Fix

### File: `src/components/dashboard/WidgetsSection.tsx`

Replace the inline `style` grid (lines 112-115) with standard Tailwind responsive grid classes:

**Before:**
```tsx
<div 
  className="grid gap-4"
  style={{
    gridTemplateColumns: `repeat(${Math.min(enabledWidgets.length, 4)}, minmax(0, 1fr))`,
  }}
>
```

**After:**
```tsx
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

This gives us:
- **Mobile** (< 640px): 1 column -- full width cards
- **Small** (640px+): 2 columns
- **Large** (1024px+): 3 columns
- **XL** (1280px+): 4 columns (matches the current max)

Widgets naturally wrap into clean rows at every breakpoint. If only 1 or 2 widgets are enabled, they simply fill the first slots in the grid without leaving awkward gaps -- CSS grid handles partial rows gracefully.

| File | Change |
|---|---|
| `src/components/dashboard/WidgetsSection.tsx` | Replace inline `style` grid with Tailwind responsive `grid-cols-*` classes |

