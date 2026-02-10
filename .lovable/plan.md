

# Match AI Insights to Announcements Widget + Improve Layout

## Overview

Transform the AI Insights from a Sheet-based side drawer into an inline expandable/collapsible card -- identical in behavior to the Announcements widget. Both buttons get a chevron indicator to signal expand/collapse capability. The expanded card layouts are refined for better readability.

## Changes

### 1. `src/components/dashboard/AIInsightsDrawer.tsx` -- Rewrite to Expandable Card

**Remove**: All `Sheet`, `SheetContent`, `SheetHeader`, etc. imports and usage.

**Add**: `framer-motion` `LayoutGroup`, `AnimatePresence`, and `motion` for the same morph animation pattern as Announcements.

**Collapsed state** (matching Announcements button exactly):
- `motion.button` with `layoutId="ai-insights-widget"`
- Same `h-9 px-4 rounded-md border` styling
- Violet/fuchsia tinted icon container (already exists)
- Add a `ChevronDown` icon (rotates to `ChevronUp` when expanded) as expand/collapse indicator
- Sentiment indicator stays inline

**Expanded state**:
- `motion.div` with same `layoutId="ai-insights-widget"`
- Full dashboard card: `rounded-2xl shadow-lg border border-border/40 bg-card`
- Top gradient accent line (same as Announcements)
- Header: oat dot + "AI BUSINESS INSIGHTS" + refresh button + collapse (X) button
- Sentiment summary row below header
- `ScrollArea` with `max-h-[500px]` for insights list and action items
- Footer: "Powered by AI" tagline
- Content fades in with stagger (same pattern as Announcements)

### 2. `src/components/dashboard/AnnouncementsDrawer.tsx` -- Add Expand/Collapse Indicator

- Add a `ChevronDown` icon to the collapsed button (after the unread badge or at the end)
- The chevron makes it visually obvious the button is expandable
- Minor layout polish on the expanded card:
  - Slightly more padding on announcement items
  - Better spacing between header controls

### 3. `src/pages/dashboard/DashboardHome.tsx` -- Layout Wrapper Update

- Wrap the `ai_insights` section content in a container that allows both widgets to expand full-width
- Change from horizontal `flex items-center gap-2` to a vertical stack when either widget is expanded:
  - Collapsed: both buttons sit side-by-side in a row (`flex-wrap gap-2`)
  - Expanded: each widget takes full width, stacking vertically

### 4. Expanded Card Layout Improvements (Both Widgets)

- **Two-column grid on wider screens**: When expanded, the card content uses a responsive layout:
  - On mobile: single column stack
  - On `md+`: For AI Insights, insights list on the left, action items on the right
  - For Announcements: remains single column (list items) but with better whitespace
- **Better header alignment**: Header row uses `justify-between` with controls grouped tightly
- **Subtle entrance**: Content area uses `initial={{ opacity: 0 }}` with a 150ms delay after the layout animation settles

## Visual Consistency

Both widgets will share:
- Identical collapsed button styles (`h-9 px-4 rounded-md border border-border`)
- Identical expanded card shells (`rounded-2xl shadow-lg border-border/40 bg-card`)
- Same top gradient accent line
- Same header pattern (oat dot + uppercase label + action buttons + X)
- Same `ScrollArea` max-height approach
- Same stagger animation for content items
- ChevronDown icon on collapsed state indicating expandability

## Files Modified
- `src/components/dashboard/AIInsightsDrawer.tsx` -- rewritten from Sheet to expandable card
- `src/components/dashboard/AnnouncementsDrawer.tsx` -- add chevron indicator, minor layout polish
- `src/pages/dashboard/DashboardHome.tsx` -- update wrapper layout for both widgets

## No Breaking Changes
- `useAIInsights` hook unchanged
- `VisibilityGate` wrapping preserved
- All AI Insights data fetching, refresh logic, cooldown timer preserved
- Announcements data fetching, mark-as-read, realtime subscription preserved
- Dashboard layout ordering system unaffected
