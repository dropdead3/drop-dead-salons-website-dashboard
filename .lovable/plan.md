

# Slide-Over Guidance View for AI Insights

## Overview
Replace the current popup dialog with a smooth slide transition. When a user clicks "How to improve" or "What you should do", the entire insights card content slides left and a new guidance panel slides in from the right -- all within the same card container. A back button returns the user to the insights list.

## How It Works
1. User clicks "How to improve" on an insight or "What you should do" on an action item
2. The current insights list slides out to the left
3. A new guidance view slides in from the right, filling the same card space
4. The guidance view includes a back arrow + title at the top, and scrollable AI-generated content below
5. Clicking the back button reverses the animation -- guidance slides out right, insights slide back in from left

## Technical Details

### 1. Refactor `GuidanceDialog.tsx` into `GuidancePanel.tsx`
- Remove the Dialog/modal entirely
- The `GuidanceButton` now just calls a callback (passed as a prop) with the insight/action context instead of opening a dialog
- Create a new `GuidancePanel` component that renders the guidance content with:
  - Back button (ArrowLeft icon + "Back to Insights" label) at the top
  - The insight/action title as a subtitle
  - ScrollArea wrapping the markdown-rendered guidance
  - Loading skeleton state
  - "AI-generated guidance" footer

### 2. Update `AIInsightsDrawer.tsx`
- Add state: `activeGuidance: { type, title, description, category?, priority? } | null`
- Add state: `guidanceText: string | null`, `isLoadingGuidance: boolean`
- Wrap the insights list and the guidance panel in an `overflow-hidden` container
- Use `framer-motion` `AnimatePresence` with two keyed views:
  - `key="insights"`: the current insights/actions list -- exits by sliding left
  - `key="guidance"`: the guidance panel -- enters by sliding in from right
- When `activeGuidance` is set, fetch the guidance from the edge function and show the guidance view
- When back is clicked, clear `activeGuidance` and reverse the animation
- Pass an `onRequestGuidance` callback down to `InsightCard` and `ActionItemCard`

### 3. Update `AIInsightsCard.tsx`
- Same pattern: lift guidance state to the card level
- Same slide-left / slide-right animation between the two views
- Pass `onRequestGuidance` callback to child cards

### 4. Remove `GuidanceDialog.tsx`
- No longer needed since the dialog approach is replaced

### Animation Details
- Insights list exit: `x: 0` to `x: -100%` (slide left)
- Guidance panel enter: `x: 100%` to `x: 0` (slide in from right)
- Reverse on back: guidance exits `x: 0` to `x: 100%`, insights enter `x: -100%` to `x: 0`
- Duration ~0.3s with easeInOut

### Files to Create
- `src/components/dashboard/GuidancePanel.tsx` -- standalone scrollable guidance view with back button

### Files to Modify
- `src/components/dashboard/AIInsightsDrawer.tsx` -- lift guidance state, add slide animation wrapper
- `src/components/dashboard/AIInsightsCard.tsx` -- same changes for the pinnable card variant

### Files to Delete
- `src/components/dashboard/GuidanceDialog.tsx` -- replaced by the new slide-over pattern
