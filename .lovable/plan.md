

## Fix: Smart Vertical Content Distribution in Goal Tracker

### The Real Problem

Adding `flex-1` to the location scoreboard wrapper makes that div stretch, but the location rows inside it stay at their natural height. The result: a big empty gap below the rows. The content didn't actually redistribute -- it just got a taller container with nothing filling it.

### The Fix

Use `justify-between` on the CardContent flex column so the org summary (ring + stats) anchors to the top and the location scoreboard anchors to the bottom. The natural spacing fills the middle. This is a clean, executive layout that works at any card height.

### Technical Changes

**File: `src/components/dashboard/sales/GoalTrackerCard.tsx`**

1. **Line 90** -- Change CardContent classes to use `justify-between` instead of `space-y-5`:
   ```tsx
   <CardContent className="flex-1 flex flex-col justify-between gap-5">
   ```
   This replaces fixed `space-y-5` spacing with `gap-5` (same minimum) but distributes extra space between the org summary block and the location scoreboard.

2. **Line 206** -- Remove `flex-1` from the location scoreboard wrapper since it no longer needs to grow:
   ```tsx
   <div>
   ```
   Back to a plain div. The `justify-between` on the parent handles distribution.

3. **Wrap the org summary + pace trend in a single group div** (lines 97-202) so `justify-between` treats them as one top block vs the scoreboard as the bottom block. Without this, the pace trend section would get pushed away from the org summary when expanded.

### Result

- Org summary (ring + stats) stays pinned to the top
- Location scoreboard stays pinned to the bottom
- Extra vertical space distributes naturally between the two sections
- When the pace trend is expanded, it stays grouped with the org summary at the top
- No dead space, no awkward stretching of individual elements
- Works for any height difference between paired cards

