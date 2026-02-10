

# Enhance GuidancePanel UI: Fixed Height, Scrollable, Better Typography

## Overview
Fix the guidance panel to use a fixed card height with proper scrolling, and significantly improve the markdown typography with better paragraph spacing, heading margins, and list formatting.

## Changes

### 1. Update `GuidancePanel.tsx` -- Improved prose styling
- Replace the generic `prose prose-sm` with custom component overrides in the `ReactMarkdown` renderer
- Add explicit spacing rules:
  - Paragraphs: `mb-4` (16px bottom margin) with `text-sm leading-relaxed`
  - Bold/strong headings within paragraphs: `font-semibold text-foreground` (stand out from body text)
  - Lists: proper `pl-5 space-y-2` with bullet styling
  - Headings (h3/h4): `mt-5 mb-2 font-medium text-foreground`
- This fixes the wall-of-text problem visible in the screenshot where bold section titles run into the paragraph text

### 2. Update container sizing in `AIInsightsDrawer.tsx`
- Change the guidance motion.div from `max-h-[500px]` to a fixed `h-[500px]` so the card maintains a consistent size regardless of content length
- The `ScrollArea` inside `GuidancePanel` already handles overflow

### 3. Update container sizing in `AIInsightsCard.tsx`
- Same change: use `h-[500px]` instead of `min-h-[300px] max-h-[500px]` for a consistent fixed card size

## Files to Modify
- `src/components/dashboard/GuidancePanel.tsx` -- Custom ReactMarkdown components for spacing
- `src/components/dashboard/AIInsightsDrawer.tsx` -- Fixed container height
- `src/components/dashboard/AIInsightsCard.tsx` -- Fixed container height
