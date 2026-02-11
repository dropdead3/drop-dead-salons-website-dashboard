

# Constrain Dialog Height with Scrollable Content

## What Changes

The dialog currently has no max-height on the container itself, so with many stylists the whole card grows past the viewport. The fix is to:

1. Add `max-h-[85vh] flex flex-col` to the `DialogContent` so the entire dialog never exceeds 85% of the viewport height
2. Change the content area from a fixed `max-h-[70vh]` div to a `flex-1 min-h-0 overflow-y-auto` div so it fills available space and scrolls internally
3. The header and sticky footer remain fixed -- only the stylist list scrolls

## Technical Details

| File | Change |
|---|---|
| `src/components/dashboard/ServiceProductDrilldown.tsx` | Line 114: add `max-h-[85vh] flex flex-col` to DialogContent className. Line 171: replace `max-h-[70vh] overflow-y-auto` with `flex-1 min-h-0 overflow-y-auto`. |

This ensures:
- With 5 stylists: dialog sizes to content naturally
- With 100 stylists: dialog caps at 85vh, list scrolls, footer stays pinned at bottom

