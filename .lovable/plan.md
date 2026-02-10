

# Clean Up Zura Icon Placement on Analytics Cards

## Problem
The Zura "Z" icon and Pin icon float as an absolute-positioned overlay (`absolute top-2 right-2`) on top of card content. This causes them to collide with each card's own header controls (sync buttons, download icons, filter badges), creating a crowded, misaligned appearance -- especially visible on the Sales Overview card.

## Root Cause
`PinnableCard` uses `position: absolute` to overlay its action buttons, but the cards it wraps already have their own header layouts with right-aligned controls. The floating icons land on top of those controls instead of integrating into the card's header flow.

## Solution: Integrate Icons Into Card Headers

Instead of floating the Zura and Pin icons as an absolute overlay, integrate them cleanly into each card's existing header row. Two approaches depending on card type:

### Approach A: Cards with custom headers (e.g., AggregateSalesCard)
These cards already render their own `CommandCenterVisibilityToggle` inline. For these, add the `ZuraCardInsight` button directly next to the existing pin icon inside the card's header -- not via `PinnableCard`.

**Changes to `AggregateSalesCard.tsx`:**
- Import and render `ZuraCardInsight` next to the existing `CommandCenterVisibilityToggle` (around line 332)
- Pass metric data context so the AI analysis is meaningful
- Both icons sit inline in the header row, perfectly aligned with other controls

### Approach B: Cards without custom headers (standard Card wrapped in PinnableCard)
For simpler cards (Revenue Trend, Location Comparison, etc.), change `PinnableCard` from absolute positioning to a different strategy:

**Changes to `PinnableCard.tsx`:**
- Move the action buttons from `absolute top-2 right-2` to a subtler inline position
- Place the Zura + Pin icons as a small row that appears on hover, aligned to the top-right corner but *inside the card's padding* rather than overlapping content
- Use `absolute top-3 right-3` with a semi-transparent backdrop pill (`bg-card/80 backdrop-blur-sm rounded-full px-1 py-0.5`) so the icons sit cleanly over the card border area without clashing with card content
- Increase `z-10` to ensure they stay above card content but below popovers

### Visual Result
```text
Before (crowded):
[Card Title]        [sync] [dl] [Z] [pin]  <-- icons overlap/stack awkwardly

After (clean):
[Card Title]  [Z] [pin]   [filter badge]  [sync] [dl] [info]
              ^-- small, inline, hover-reveal
```

## Files Changed

1. **`src/components/dashboard/PinnableCard.tsx`**
   - Change absolute positioning from `top-2 right-2` to `top-3 right-3`
   - Add backdrop pill styling: `bg-card/80 backdrop-blur-sm rounded-full px-1.5 py-1`
   - Ensure clean spacing with `gap-0.5` between icons
   - Reduce icon button sizes slightly for a more refined feel

2. **`src/components/dashboard/ZuraCardInsight.tsx`**
   - Reduce trigger button padding for tighter fit
   - Ensure the avatar renders at a consistent small size that aligns with the pin icon

3. **`src/components/dashboard/AggregateSalesCard.tsx`**
   - Add `ZuraCardInsight` next to the existing inline `CommandCenterVisibilityToggle` in the header
   - Pass metric data (`totalRevenue`, `serviceRevenue`, `productRevenue`, `averageTicket`) for contextual AI analysis

4. **`src/components/dashboard/sales/TopPerformersCard.tsx`**
   - No changes needed -- this card is wrapped by `PinnableCard` and will benefit from the positioning fix automatically

## Design Principles
- Icons appear on hover only (existing behavior, kept)
- Backdrop pill prevents icons from visually clashing with card content beneath them
- Consistent sizing: both Zura and Pin icons use the same `h-7 w-7` button dimensions
- Cards that manage their own header (like AggregateSalesCard) get the Zura icon inline; all others get it via the improved PinnableCard overlay
