

## Enhance Table Column Headers with Visual Prominence

### What Changes

The column headers ("Stylist", "Level", "Svc %", "Retail %", "Source") are too subtle at `text-[11px]` with muted color. They need to feel more like proper headings with a subtle bottom border stroke.

### Plan

**1. Update `tokens.table.columnHeader` in `design-tokens.ts`**

Increase size from `text-[11px]` to `text-xs` (12px), keep `font-medium`, use `text-foreground/60` instead of `text-muted-foreground` for slightly more prominence, and retain tracking.

```
columnHeader: 'font-sans text-xs font-medium text-foreground/60 tracking-wider',
```

**2. Update `TeamCommissionRoster.tsx` header row**

Add a bottom border to the header row container to create the subtle stroke effect:

```tsx
<div className={cn(
  "grid grid-cols-[28px_1fr_140px_70px_70px_90px] gap-2 px-3 py-2 border-b border-border/60",
  tokens.table.columnHeader
)}>
```

- Increase vertical padding from `py-1.5` to `py-2` for breathing room above the stroke
- Add `border-b border-border/60` for the subtle underline

No other files need changes -- this updates the token globally and adds the stroke to the roster header row.

### Files Changed

| File | Change |
|------|--------|
| `src/lib/design-tokens.ts` | Bump `columnHeader` to `text-xs`, use `text-foreground/60` |
| `src/components/dashboard/settings/TeamCommissionRoster.tsx` | Add `border-b border-border/60`, increase padding |

