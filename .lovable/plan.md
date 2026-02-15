

## Fix: Revenue Breakdown Title Getting Cut Off

### Problem
The "REVENUE BREAKDOWN" title uses `truncate` which clips the text at smaller widths. The `font-display` (Termina) with `tracking-wide` also adds extra width to the characters.

### Solution
Two small changes in `src/components/dashboard/sales/RevenueDonutChart.tsx` (line 48):

1. **Remove `truncate`** so the title can wrap or display fully.
2. **Reduce font size** from `text-base` to `text-sm` so it fits the sidebar card width without clipping.

```tsx
// Before
<CardTitle className="font-display text-base tracking-wide truncate">REVENUE BREAKDOWN</CardTitle>

// After
<CardTitle className="font-display text-sm tracking-wide">REVENUE BREAKDOWN</CardTitle>
```

This keeps the title fully visible while maintaining the uppercase Termina styling consistent with the card's compact sidebar layout.

