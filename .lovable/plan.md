

## Smart Content Re-Layout for Stretched Cards

### What You're Seeing

The equal-height pairing stretches the Goal Tracker card container to match New Bookings, but the content inside stops at its natural height -- leaving dead space at the bottom. You're right that simply top-aligning isn't enough.

### Approach

This needs two layers of work:

**Layer 1: Make card content fill the stretched container (structural)**

Propagate the flex-grow signal through the Card component so the content area expands:

- **GoalTrackerCard**: Add `h-full flex flex-col` to the `Card`, and `flex-1` to `CardContent` so the location scoreboard section grows into available space
- **NewBookingsCard**: Same treatment for consistency (both cards in a pair should fill their containers)

**Layer 2: Smart content distribution (the actual re-layout)**

For the Goal Tracker specifically, when extra vertical space is available:

- The **Location Scoreboard** section gets `flex-1` so it naturally expands to fill remaining height
- Location rows within it space out with `justify-start` (content stays at top of the scoreboard area, which is clean and readable)
- The org summary (progress ring + stats) stays compact at the top -- stretching it would look wrong

This is the right pattern because the scoreboard is the variable-length content. The ring and stats are fixed-size elements that should stay tight.

### Technical Changes

**File: `src/components/dashboard/sales/GoalTrackerCard.tsx`**

1. Add `h-full flex flex-col` to the `Card` element (line 71):
   ```tsx
   <Card className={cn(tokens.card.wrapper, "h-full flex flex-col")}>
   ```

2. Add `flex-1 flex flex-col` to `CardContent` (line 90):
   ```tsx
   <CardContent className="space-y-5 flex-1 flex flex-col">
   ```

3. Wrap the location scoreboard section (line 206) with `flex-1` so it grows into available space:
   ```tsx
   <div className="flex-1 flex flex-col">
     {/* existing location scoreboard content */}
   </div>
   ```

**File: `src/components/dashboard/NewBookingsCard.tsx`**

Apply the same `h-full flex flex-col` pattern to its Card so both halves of a pair fill equally.

**File: `src/components/dashboard/PinnableCard.tsx`**

No changes needed -- the existing `[&>*]:flex-1` already passes flex-grow to direct children.

### What This Achieves

- Both cards in a pair fill to the same height (no dead space)
- The Goal Tracker's location scoreboard naturally absorbs the extra height
- Fixed elements (progress ring, stats grid) stay compact and well-proportioned
- No content gets awkwardly stretched or distorted
- Works for any height difference, not just this specific pairing
