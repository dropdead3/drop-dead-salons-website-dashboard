

# Fix AI Insights Card Scrolling

## Root Cause
The `Card` wrapper (line 259) has `overflow-hidden` which clips the scrollbar of the inner scrollable container. The Card itself has no height constraint, so it grows to fit all content and then clips it — preventing any child `overflow-y-auto` from working.

## Fix (1 file)

### `src/components/dashboard/AIInsightsCard.tsx`

1. **Remove `overflow-hidden` from the Card** (line 259) — change `"rounded-2xl shadow-2xl overflow-hidden"` to `"rounded-2xl shadow-2xl"`

2. **Add a flex column layout with a constrained height to the Card** so the CardContent area becomes scrollable:
   - Add `max-h-[600px] flex flex-col` to the Card
   - Add `flex-1 min-h-0 overflow-y-auto` to the `CardContent` wrapper (line 294)
   - Remove `max-h-[500px] overflow-y-auto` from the inner `div` (line 295) since the scroll now lives on CardContent

This approach keeps the header (title, summary, refresh button) always visible and pinned at the top, while the content area beneath it scrolls naturally.

### Why this works
- `flex flex-col` on the Card makes the header take its natural height
- `flex-1 min-h-0` on CardContent lets it fill remaining space while allowing shrinking below content size
- `overflow-y-auto` on CardContent enables the scrollbar at the correct level
- `min-h-0` is the critical piece — without it, flex children won't shrink below their content size in CSS

