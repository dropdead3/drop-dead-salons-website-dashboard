

## Fix Hover Overlay Covering Card Header Content

### Problem
The Zura AI icon and pin-to-dashboard icon appear on hover via `PinnableCard` at a fixed position (`absolute top-3 right-3`). This overlaps with card header elements like filter badges and revenue totals (e.g., "$2,021 total" on Location Comparison), making them unreadable and unclickable.

This affects every card wrapped in `PinnableCard` -- not just Location Comparison.

### Solution
Move the hover overlay from the top-right corner (where it conflicts with header content) to the **bottom-right corner** of the card. This keeps the controls accessible without covering any card content.

### What Changes

**File:** `src/components/dashboard/PinnableCard.tsx` (line 48)

Change the overlay positioning from:
```
absolute top-3 right-3
```
to:
```
absolute bottom-3 right-3
```

This is a single class change. The overlay keeps its existing behavior (opacity on hover, backdrop blur pill, z-10) but anchors to the bottom-right instead.

### Why Bottom-Right
- Card headers universally contain titles, badges, and filters in the top area
- Card footers/bottom areas are typically empty or have minimal content
- Bottom-right is a common pattern for floating action buttons
- No card currently has interactive elements in the bottom-right corner

### Files Modified
1. `src/components/dashboard/PinnableCard.tsx` -- move overlay from top-right to bottom-right
