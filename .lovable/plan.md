

# Fix AI Insights Layout: Full-Width Sections with Scrolling

## The Problem
Currently, the insights content uses a `grid grid-cols-1 md:grid-cols-2` layout (line 320 in the Drawer, similar in the Card). This splits insights into the left column and action items + suggestions into the right column, making each item narrow and creating wasted space.

## The Solution
Replace the 2-column grid with a single-column stacked layout where all 3 content categories (Insights, Action Items, Suggested For You) are displayed full-width, separated by clear section headers. The entire content area scrolls within the fixed card height.

### Layout Structure
```text
+------------------------------------------+
|  AI BUSINESS INSIGHTS  [Refresh] [Close] |
|  Summary line...                         |
+------------------------------------------+
|  [Scrollable area]                       |
|                                          |
|  --- INSIGHTS ---                        |
|  [Full-width insight card]               |
|  [Full-width insight card]               |
|  [Full-width insight card]               |
|                                          |
|  --- ACTION ITEMS ---                    |
|  [Full-width action item]               |
|  [Full-width action item]               |
|                                          |
|  --- SUGGESTED FOR YOU ---               |
|  [Full-width suggestion card]            |
|  [Full-width suggestion card]            |
|                                          |
+------------------------------------------+
|  Powered by AI                           |
+------------------------------------------+
```

## Changes

### 1. `AIInsightsDrawer.tsx` (line ~320)
- Replace `grid grid-cols-1 md:grid-cols-2 gap-4` with `space-y-5` (single-column stack)
- Move action items and suggestions out of their wrapper `<div>` so all 3 sections are siblings at the same level
- Each section gets its own header and spans the full card width

### 2. `AIInsightsCard.tsx` (line ~315)
- Same change: replace the 2-column grid with `space-y-5` single-column layout
- Flatten the section structure so insights, action items, and suggestions are all top-level siblings

## Files to Modify
- `src/components/dashboard/AIInsightsDrawer.tsx` -- remove grid, use stacked layout
- `src/components/dashboard/AIInsightsCard.tsx` -- same change

