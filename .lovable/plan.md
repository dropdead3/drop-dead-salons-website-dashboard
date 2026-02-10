

# AI-Generated Task Items with "Add to Tasklist" Functionality

## Overview
Extend the AI Business Insights system to generate structured task items (checkbox-style) alongside existing action items. Users can review these AI-suggested tasks inline and add them to their personal task list with one click. A new "AI Tasks" widget on the command center (dashboard) surfaces incomplete AI-suggested tasks for quick access.

## How It Works
1. The AI edge function generates a new `suggestedTasks` array in its structured output -- each with a title, priority, and optional due date
2. In the AI Insights UI (Drawer and Card), these appear as checkbox-style items with an "Add to my tasks" button
3. Clicking "Add" creates a real task in the `tasks` table with a `source` column set to `'ai_insights'` so they can be tracked/filtered
4. A new `AITasksWidget` component appears in the widgets section, showing only AI-sourced incomplete tasks

## Database Changes

### Alter `tasks` table -- add `source` column
Add a `source` text column (default `'manual'`) to distinguish AI-generated tasks from user-created ones:

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| source | text | 'manual' | Values: 'manual', 'ai_insights' |

No new tables needed -- we reuse the existing `tasks` table.

## Edge Function Changes (`ai-business-insights/index.ts`)

Add a new `suggestedTasks` array to the tool schema:

```
suggestedTasks: [{
  title: string,        // Clear, actionable task title
  priority: "high" | "medium" | "low",
  dueInDays: number | null   // Suggested days from now (e.g. 7), or null
}]
```

Update the system prompt to instruct the AI to generate 3-5 specific, actionable checkbox-style tasks the owner can complete based on the data patterns. These should be concrete and completable (e.g., "Review and reach out to 5 clients who haven't visited in 60+ days") rather than vague recommendations.

## Frontend Changes

### 1. Update `useAIInsights.ts`
- Add `SuggestedTask` interface to `AIInsightsData`:
  ```
  interface SuggestedTask {
    title: string;
    priority: 'high' | 'medium' | 'low';
    dueInDays: number | null;
  }
  ```
- Add `suggestedTasks?: SuggestedTask[]` to `AIInsightsData`

### 2. Update `useTasks.ts`
- Modify `createTask` mutation to accept an optional `source` parameter (defaults to `'manual'`)
- Add it to the insert payload

### 3. Update `AIInsightsDrawer.tsx` and `AIInsightsCard.tsx`
- Add a new "AI SUGGESTED TASKS" section below Action Items
- Each task renders as:
  - A checkbox icon (unchecked, decorative)
  - The task title
  - Priority badge
  - An "Add to tasks" button (Plus icon)
- On clicking "Add to tasks":
  - Call `createTask` with `source: 'ai_insights'` and computed `due_date` (today + dueInDays)
  - Show a success toast "Task added to your list"
  - Visually mark the item as added (checkmark, greyed out) using local state
- These components will need access to `useTasks().createTask` -- passed via a new `onAddTask` prop to avoid hook nesting issues

### 4. Create `AITasksWidget` component
- New file: `src/components/dashboard/AITasksWidget.tsx`
- A compact card widget that shows tasks where `source = 'ai_insights'` and `is_completed = false`
- Each item is a checkbox with the task title; toggling marks it complete
- Header: "AI Suggested Tasks" with a Brain icon
- Empty state: "No pending AI tasks"

### 5. Register widget in `WidgetsSection.tsx`
- Add `{ id: 'ai_tasks', label: 'AI Tasks', icon: Brain }` to `AVAILABLE_WIDGETS`
- Include `<AITasksWidget />` in the widget grid wrapped in `VisibilityGate`
- Add `'ai_tasks'` to the default enabled widgets list

### 6. Update `DashboardHome.tsx`
- Pass `createTask` to the AI Insights components (the Drawer already has access in scope, but the action items section needs to call it)

## Files to Create
- `src/components/dashboard/AITasksWidget.tsx`

## Files to Modify
- `supabase/functions/ai-business-insights/index.ts` -- add `suggestedTasks` to tool schema and prompt
- `src/hooks/useAIInsights.ts` -- add `SuggestedTask` type
- `src/hooks/useTasks.ts` -- accept `source` param in `createTask`
- `src/components/dashboard/AIInsightsDrawer.tsx` -- render suggested tasks with "Add" button
- `src/components/dashboard/AIInsightsCard.tsx` -- same
- `src/components/dashboard/WidgetsSection.tsx` -- register AI Tasks widget
- `src/pages/dashboard/DashboardHome.tsx` -- wire up task creation to insights components

## Database Migration
- `ALTER TABLE tasks ADD COLUMN source text NOT NULL DEFAULT 'manual';`
