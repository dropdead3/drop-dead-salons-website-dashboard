

# Convert AI Insights to a Slide-Out Drawer Widget

## Overview
Replace the inline AI Business Insights card on the Command Center with a trigger button that opens a right-side Sheet (drawer). The same drawer will also be accessible from the Analytics Hub page.

## Changes

### 1. Create `AIInsightsDrawer` component
**New file: `src/components/dashboard/AIInsightsDrawer.tsx`**
- A reusable component that wraps the existing insight content in a `Sheet` (right-side slide-out panel)
- Accepts an `open` / `onOpenChange` prop pair, or includes its own trigger button
- Reuses all existing insight rendering logic (InsightCard, ActionItemCard, severity styles, blur handling)
- The trigger button will be a compact button with a Brain icon and "AI Insights" label
- The sheet content will contain the full insights UI currently in `AIInsightsCard`

### 2. Create `AIInsightsTrigger` component
**New file or same file: `src/components/dashboard/AIInsightsTrigger.tsx`**
- A small, styled button/card that acts as the trigger on the dashboard
- Shows a Brain icon, "AI Insights" label, and optionally the overall sentiment indicator
- Clicking it opens the drawer
- Wrapped in `VisibilityGate` for role-based access (leadership only)

### 3. Update Command Center (`DashboardHome.tsx`)
- Replace the inline `<AIInsightsCard />` in the `sectionComponents` map with the new `AIInsightsTrigger` that opens the drawer
- The `ai_insights` section key remains so existing layout preferences are preserved
- The drawer renders at the page level (outside sections) so it overlays correctly

### 4. Add to Analytics Hub (`AnalyticsHub.tsx`)
- Import and add the `AIInsightsTrigger` button (or a simple icon button) in the Analytics Hub header area
- Clicking it opens the same `AIInsightsDrawer`
- Wrapped in a `VisibilityGate` for consistency

### 5. Refactor `AIInsightsCard.tsx`
- Extract the inner content (insights list, action items, empty state, loading skeleton) into a reusable `AIInsightsContent` component
- The trigger and drawer components will import `AIInsightsContent`
- Keep the original `AIInsightsCard` export for backward compatibility if needed, but the dashboard will use the new drawer pattern

## Technical Details

- Uses the existing `Sheet` component (`src/components/ui/sheet.tsx`) with `side="right"`
- Sheet width: `sm:max-w-md` (wider than default `sm:max-w-sm` to give insights room)
- The trigger on the dashboard will be a slim card with an icon and label, fitting naturally among other sections
- The trigger in the Analytics Hub will be a button in the page header actions area
- All existing privacy/blur functionality carries over unchanged
- The `useAIInsights` hook is used identically -- no backend changes needed

## Files to Create
1. `src/components/dashboard/AIInsightsDrawer.tsx` -- Sheet wrapper + trigger + content

## Files to Modify
1. `src/components/dashboard/AIInsightsCard.tsx` -- Extract content into reusable sub-component
2. `src/pages/dashboard/DashboardHome.tsx` -- Replace inline card with drawer trigger
3. `src/pages/dashboard/admin/AnalyticsHub.tsx` -- Add drawer trigger to header
