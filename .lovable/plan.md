

## Smart Content Scaling for Goal Tracker Card

### Problem

The `justify-between` layout pushes the Location Scoreboard to the bottom, but the progress ring (hardcoded at 120px) and stats grid stay at their natural small size, creating a large empty gap in the middle. The content needs to grow to fill available space.

### Solution

Two changes that work together:

**1. Top group becomes a centered flex container**

The wrapper div around the org summary and pace trend gets `flex-1 flex flex-col justify-center` so it expands into available space and vertically centers its content. This eliminates the dead gap.

**2. Scale up the progress ring and stats**

Increase the progress ring from 120px to 160px. This makes the visual hero element more commanding and proportional to the card size. The percentage text inside scales up to match (`text-3xl`). The stats grid gets slightly larger text (`text-base` instead of `text-sm`) and more generous spacing.

### Technical Changes

**File: `src/components/dashboard/sales/GoalTrackerCard.tsx`**

1. **Line 47**: Increase ring size from 120 to 160:
   ```tsx
   const size = 160;
   ```

2. **Line 48**: Increase stroke width from 8 to 10 for visual balance:
   ```tsx
   const strokeWidth = 10;
   ```

3. **Line 98**: Add flex growth and centering to the top group:
   ```tsx
   <div className="space-y-5 flex-1 flex flex-col justify-center">
   ```

4. **Line 136**: Scale up percentage text:
   ```tsx
   <span className="text-3xl font-display font-medium">
   ```

5. **Lines 162, 168, 174, 180**: Scale up stat values from `text-sm` to `text-base`:
   ```tsx
   <p className="text-base font-medium">
   ```

### Result

- The progress ring becomes a larger, more commanding visual element (160px vs 120px)
- The top content group centers itself vertically in the available space
- Stats text scales up proportionally
- Location Scoreboard stays anchored at the bottom
- The card feels intentionally designed at any height, not just stretched

