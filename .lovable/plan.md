

## Move Tasks and Widgets Below Pinned Analytics Cards

### Problem

In detailed mode, pinned analytics cards are rendered in a separate block **after** the main section loop. This forces tasks (`schedule_tasks`) and widgets to appear above the analytics cards, even though their position in `sectionOrder` says otherwise. The screenshot confirms: My Tasks and Widgets sit above where the analytics cards should be.

### Root Cause

In `DashboardHome.tsx`, the main rendering loop (line 714) iterates `orderedSectionIds` and renders regular sections inline, but returns `null` for pinned card entries in detailed mode (line 769). Then a separate block at lines 781-858 renders all pinned cards with bento grouping -- but this block is **after** the loop, so it always appears at the bottom.

### Solution

Move the bento-grouped pinned cards rendering **inside** the main loop, triggered at the position of the **first** pinned card entry. This way the analytics cards render at their correct position in the section order, and tasks/widgets render after them (as defined by `sectionOrder`).

### Technical Changes

**File: `src/pages/dashboard/DashboardHome.tsx`**

1. In the detailed-mode branch of the pinned card handler (around line 767-769), instead of always returning `null`, check if this is the **first** pinned card in the order. If it is, render the entire bento-grouped block (filter bar + all grouped pinned cards) right there -- the same logic currently at lines 781-858 but moved inline.

2. Remove the separate post-loop block (lines 780-858) since the pinned cards will now render within the loop.

3. The logic stays identical -- collect all visible pinned IDs, group consecutive halves into pairs, render with bento pairing and equal-height stretching. The only change is **where** this block appears in the rendered output.

This is a rendering position change only. No new components, no data changes, no database updates.

