
## Fix Services Manager Stats Cards Responsive Layout

### Problem
The 5 stat cards (Total Services, Categories, Stylist Levels, Popular, Online) are displayed in a `grid-cols-2 md:grid-cols-5` layout. Since this content lives inside the ~380px Website Editor sidebar panel, the `md` breakpoint fires based on the viewport (not the container), forcing all 5 cards into a single cramped row. Text gets truncated and cards spill.

### Solution
Change the stats grid to always wrap nicely within the constrained sidebar width:
- Use `grid-cols-2` with the 5th card spanning full width, OR
- Use `grid-cols-3` for the first row and `grid-cols-2` for overflow, OR
- Simplest: use `flex flex-wrap gap-3` so cards auto-wrap based on available space.

The cleanest approach: switch from a rigid grid to a **flex-wrap** layout with min-width on each card, so the cards naturally flow into 2-3 per row depending on container width. This avoids breakpoint issues entirely since the sidebar width doesn't correspond to viewport breakpoints.

### Technical Changes

**File: `src/components/dashboard/website-editor/ServicesContent.tsx`**

1. **Line 302**: Change the stats container from `grid grid-cols-2 md:grid-cols-5 gap-4` to `flex flex-wrap gap-3`
2. **Lines 303-359 (each Card)**: Add a `flex-1 min-w-[140px]` class to each stat Card so they size correctly -- each card takes equal space but wraps to a new row when the container is too narrow for 5 across. This gives 2 cards per row in the sidebar (~380px) naturally.
3. Slightly reduce the inner padding from `p-4` to `p-3` for a tighter fit within the sidebar.
