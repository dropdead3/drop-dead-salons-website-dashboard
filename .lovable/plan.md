

## Equal-Height Card Pairing for Smart Bento Rows

### Concept

When two cards are paired side-by-side, the shorter card should stretch to match the height of its taller neighbor. This creates a unified row that feels like a single cohesive block rather than two mismatched cards.

### Why This Is a Good Idea

- Flex's default `items-stretch` already wants to do this -- the cards just aren't configured to fill their container height
- Paired cards are already content-similar (both marked `half`), so stretching won't create awkward empty space
- It's the standard for bento/dashboard layouts (Notion, Linear, Arc all do this)
- One-line fix, zero risk

### Technical Change

**File: `src/pages/dashboard/DashboardHome.tsx`** (lines 842-849)

Add `h-full` to the inner wrapper divs so the `PinnedAnalyticsCard` fills the stretched flex child:

```tsx
// Before:
<div key={`pair-${gi}`} className="flex gap-4">
  <div className="flex-1 min-w-0">
    <PinnedAnalyticsCard ... />
  </div>
  <div className="flex-1 min-w-0">
    <PinnedAnalyticsCard ... />
  </div>
</div>

// After:
<div key={`pair-${gi}`} className="flex gap-4 items-stretch">
  <div className="flex-1 min-w-0 flex flex-col">
    <PinnedAnalyticsCard ... />
  </div>
  <div className="flex-1 min-w-0 flex flex-col">
    <PinnedAnalyticsCard ... />
  </div>
</div>
```

**File: `src/components/dashboard/PinnedAnalyticsCard.tsx`**

Ensure the outermost wrapper element of each rendered card uses `h-full` so it fills the flex-col parent. This likely means adding `h-full` to the `PinnableCard` or outer `Card` wrapper that each card case returns.

This is a minimal, safe change -- flex stretch is already the browser default, we're just removing the height constraints that prevent cards from filling their row.
