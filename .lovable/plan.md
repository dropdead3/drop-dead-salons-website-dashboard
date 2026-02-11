

## Inline Hover Footer for Card Controls

### Problem
The current approach places the Zura and pin icons in a floating pill below the card boundary. This makes it ambiguous which card the controls belong to, especially when cards are stacked vertically.

### Solution
Replace the absolutely-positioned overlay with a **collapsible inline footer row** inside the card. On hover, the footer smoothly expands (via max-height transition) to reveal the controls. Since it's in the normal document flow, it never overlaps card content and is clearly "part of" the card.

```text
+------------------------------------------+
| Card Title            Filter  |  $2,021  |
| Chart / content area                     |
| Location rows...                         |
+------------------------------------------+
|                          [Z] [pin]       |  <-- appears on hover, inside card
+------------------------------------------+
```

### Technical Approach

**File: `src/components/dashboard/PinnableCard.tsx`**

1. Remove absolute positioning from the controls container
2. Remove `overflow-visible` and `mb-2` from the wrapper (no longer needed)
3. Add a new inline div after `{children}` that acts as a collapsible footer:
   - Default state: `max-h-0 opacity-0 overflow-hidden`
   - Hover state (via `group-hover:`): `max-h-10 opacity-100`
   - Smooth transition on both max-height and opacity
   - Controls are right-aligned within the footer
   - Subtle top border or background tint to visually separate from card content

```tsx
<div className={cn("relative group", className)}>
  {children}
  <div className="max-h-0 opacity-0 group-hover:max-h-10 group-hover:opacity-100 overflow-hidden transition-all duration-200 ease-in-out">
    <div className="flex items-center justify-end gap-0.5 px-3 py-1 border-t border-border/30">
      <ZuraCardInsight ... />
      <CommandCenterVisibilityToggle ... />
    </div>
  </div>
</div>
```

### Why This Is Better
- Controls are clearly inside their parent card -- no ambiguity
- Zero content overlap -- the footer is in document flow, not absolute
- Smooth expand/collapse animation feels polished
- The subtle top border reinforces the visual boundary
- No extra margins or overflow hacks needed
- Works universally regardless of card height or content density

### Files Modified
1. `src/components/dashboard/PinnableCard.tsx` -- replace absolute overlay with inline collapsible footer

