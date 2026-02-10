
# Move AI Suggested Tasks into the Guidance Panel

## Overview
Remove the "AI Suggested Tasks" section from the main insights card view and instead render it inside the GuidancePanel slide-over (the view that appears when clicking "How to improve" or "What you should do"). The tasks will appear below the AI-generated guidance text, making the main card cleaner and grouping actionable tasks with their related guidance.

## Changes

### 1. Update `GuidancePanel.tsx`
- Accept new optional props: `suggestedTasks` (the task array) and `onAddTask` (callback to create a task)
- Render the `SuggestedTasksSection` component below the markdown guidance content, inside the scrollable area
- Add a subtle separator between the guidance text and the tasks section
- Import `SuggestedTasksSection` and the `SuggestedTask` type

### 2. Update `AIInsightsDrawer.tsx`
- Remove the `<SuggestedTasksSection>` block from the main insights scroll area (around lines 342-347)
- Pass `suggestedTasks={data?.suggestedTasks}` and `onAddTask` to the `<GuidancePanel>` component (around line 432-438)
- Remove `SuggestedTasksSection` import if no longer used directly

### 3. Update `AIInsightsCard.tsx`
- Same changes: remove `<SuggestedTasksSection>` from the main card view (around lines 336-341)
- Pass `suggestedTasks` and `onAddTask` props to `<GuidancePanel>` (around line 421-427)
- Remove `SuggestedTasksSection` import if no longer used directly

## Files to Modify
- `src/components/dashboard/GuidancePanel.tsx` -- accept and render suggested tasks
- `src/components/dashboard/AIInsightsDrawer.tsx` -- remove tasks from main view, pass to GuidancePanel
- `src/components/dashboard/AIInsightsCard.tsx` -- same
