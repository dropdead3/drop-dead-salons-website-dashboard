

# Fix AI Insights Card Scrolling (For Real This Time)

## Problem
The `ScrollArea` component on line 298 is not working because:
1. The `Card` on line 262 has no height constraint -- it grows to fit all content, so `ScrollArea` never detects overflow
2. `AnimatePresence` with `motion.div` wrappers can interfere with how Radix ScrollArea measures content vs viewport

## Solution

### `src/components/dashboard/AIInsightsCard.tsx`

1. **Add a fixed max-height and overflow constraint to the Card itself** (line 262):
   - Change `"rounded-2xl shadow-2xl"` to `"rounded-2xl shadow-2xl max-h-[600px] flex flex-col overflow-hidden"`

2. **Make CardContent fill remaining space** (line 297):
   - Add `flex-1 min-h-0` so it shrinks within the Card's max-height

3. **Replace `ScrollArea` with native CSS scroll** (lines 298, 430):
   - Remove `<ScrollArea className="h-[450px]">` and its closing tag
   - Instead, wrap the `AnimatePresence` block in a plain `div` with `style={{ overflowY: 'auto', maxHeight: '100%' }}` using inline styles (to avoid Tailwind specificity issues that have failed in prior attempts)
   - This bypasses the Radix ScrollArea viewport measurement issue with animated children

4. **Remove `initial={false}` from the insights `motion.div`** (line 303) to keep layout stable

### Why previous attempts failed
- Tailwind `overflow-y-auto` on a flex child inside a Card with no height cap does nothing -- there's no overflow to scroll
- `ScrollArea` requires its viewport to be shorter than its content, but `AnimatePresence`/`motion.div` don't report stable heights during animation, so the viewport thinks content fits
- The Card was always expanding to fit content rather than constraining it

### Why this will work
- `max-h-[600px]` on the Card caps its height so content overflows
- `flex flex-col` + `flex-1 min-h-0` on CardContent forces it to shrink
- Native `overflow-y: auto` with inline styles is the most reliable scrolling approach and isn't affected by animation wrapper quirks
