

## Bento Grid Layout Component with Smart Row Distribution

### Concept
Create a reusable `BentoGrid` component that enforces a simple rule: when cards overflow into a second row, distribute them as evenly as possible, with the extra card always going to the top row.

**Distribution examples:**
- 2 cards: 2 (single row)
- 3 cards: 3 (single row)
- 4 cards: 4 (single row -- or 2+2 if container is narrow)
- 5 cards: 3 top + 2 bottom
- 6 cards: 3 + 3
- 7 cards: 4 + 3
- 8 cards: 4 + 4
- 9 cards: 5 + 4

### Approach
Rather than using CSS flex-wrap (which has no concept of "balance rows"), we split children into explicit rows in JavaScript and render each row as its own flex container.

```text
Container
  Row 1 (flex, equal-width children): [Card] [Card] [Card]
  Row 2 (flex, equal-width children): [Card] [Card]
```

### Technical Changes

**1. New file: `src/components/ui/bento-grid.tsx`**

A small, reusable component:

```tsx
interface BentoGridProps {
  children: React.ReactNode;
  maxPerRow?: number; // max cards before wrapping (default: 3)
  gap?: string;       // tailwind gap class (default: "gap-3")
  className?: string;
}
```

Logic:
- Count the children.
- If count <= `maxPerRow`, render one row.
- If count > `maxPerRow`, split into 2 rows:
  - Top row gets `Math.ceil(count / 2)` items.
  - Bottom row gets the rest.
- Each row is a `flex` container where children get `flex-1`.

This keeps the rule pure and reusable across the platform (analytics cards, dashboard stats, etc.).

**2. Update `src/components/dashboard/website-editor/ServicesContent.tsx`**

Replace the `<div className="flex flex-wrap gap-3">` wrapper (line 302) with `<BentoGrid maxPerRow={3} gap="gap-3">`. Remove `flex-1 min-w-[140px]` from individual cards since BentoGrid handles sizing.

The 5 stat cards will render as:
- Row 1: Total Services, Categories, Stylist Levels (3 cards)
- Row 2: Popular, Online (2 cards)

Each card in a row stretches equally, so row 2's cards are slightly wider than row 1's -- a clean, balanced bento look.

