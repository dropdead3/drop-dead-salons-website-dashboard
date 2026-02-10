
# Make "Click to reveal" Tooltip Fully Rounded and Faster

## Problem
The "Click to reveal" hint currently uses the browser's native `title` attribute, which renders as a plain rectangle and has a ~500ms delay before appearing. The user wants it fully rounded (pill-shaped) and near-instant on hover.

## Solution

### 1. Update Tooltip component to support fast + rounded variant
**File: `src/components/ui/tooltip.tsx`**
- Change `rounded-md` to `rounded-full` in the default TooltipContent class to make all tooltips pill-shaped
- This is a global change but appropriate since the design system should be consistent

### 2. Wrap `BlurredAmount` in a Radix Tooltip (hidden state only)
**File: `src/contexts/HideNumbersContext.tsx`**
- Import `Tooltip`, `TooltipTrigger`, `TooltipContent` from the UI tooltip
- When `hideNumbers` is true, wrap the blurred element in a `Tooltip` with `delayDuration={100}` (near-instant)
- Remove the `title="Click to reveal"` attribute
- Also remove `title="Double-click to hide"` from the visible state (or optionally convert it too)

### 3. Wrap `AnimatedBlurredAmount` in a Radix Tooltip
**File: `src/components/ui/AnimatedBlurredAmount.tsx`**
- Same pattern: import tooltip components, wrap with `Tooltip` and `delayDuration={100}`
- Remove the native `title` attribute

### 4. SVG tooltips in ForecastingCard stay as native `<title>`
The SVG `<title>` elements inside the chart are SVG-native accessibility labels and won't show the same browser tooltip style -- these are fine to keep as-is since they're inside an SVG context where Radix tooltips can't easily wrap.

## Technical Notes
- The `TooltipProvider` likely already wraps the app (or we add `delayDuration={100}` per-tooltip instance)
- `rounded-full` on the TooltipContent gives the pill shape
- `delayDuration={100}` makes it appear almost instantly (vs browser default ~500ms)
