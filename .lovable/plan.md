

## Move Hover Controls Outside the Card Boundary

### Problem
The Zura (Z) and pin icons are absolutely positioned **inside** the card. Whether top-right or bottom-right, they cover card data (revenue figures, location rows, etc.). This is a fundamental layout issue — no internal position is safe.

### Solution
Position the hover controls as a floating pill that appears **just below the card's bottom edge**, outside the card content area entirely. On hover, the pill slides up into view from beneath the card.

```text
+------------------------------------------+
| Card content...                          |
| $875            $1,146                   |
+------------------------------------------+
              [Z] [pin]   <-- appears below card on hover
```

### Technical Approach

**File: `src/components/dashboard/PinnableCard.tsx`**

1. Add `overflow-visible` to the wrapper so child elements can render outside the card bounds
2. Position the controls with `bottom-0 translate-y-full` -- this places the pill flush below the card
3. Add a small `pb-1` bottom margin so the pill doesn't visually collide with cards stacked below
4. Keep the existing hover opacity transition for smooth appearance

Updated positioning classes:
```
- absolute bottom-3 right-3 ...
+ absolute -bottom-1 right-3 translate-y-full ...
```

The wrapper gets:
```
- relative group
+ relative group overflow-visible mb-2
```

The `mb-2` adds a small gap between cards to give the floating pill space to appear without overlapping the next card below.

### Why This Works
- Zero overlap with card content -- controls exist outside the card boundary
- The pill only appears on hover, so it doesn't permanently consume vertical space
- Works universally for all card sizes and content layouts
- Keeps the existing luxury backdrop-blur pill aesthetic
- The small added margin between cards is barely noticeable in normal state

### Files Modified
1. `src/components/dashboard/PinnableCard.tsx` -- reposition overlay outside card boundary
