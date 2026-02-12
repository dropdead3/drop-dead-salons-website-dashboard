

# Show Selectable AI Tasks in Recovery Plan Dialog

## What Changes

The recovery plan dialog currently shows a wall of text followed by action buttons. We'll add a selectable task list (matching the AI Suggested Tasks pattern you see in the guidance panel) between the plan text and the Save/Remind/Implement buttons.

These extracted tasks become the curated list that flows into "Let's Implement" -- so you see exactly what actions are being proposed, pick which ones matter, and then route them.

## How It Works

1. When the recovery plan loads, the `---ACTIONS---` block is parsed into structured task items
2. Tasks appear as a selectable checklist (with priority badges and due dates) below the plan text
3. You select/deselect which tasks to include
4. Clicking "Let's Implement" passes only the selected tasks into the implementation dialog -- pre-populated and ready to route

## Technical Changes

### File 1: `src/components/dashboard/sales/SalesGoalProgress.tsx`

- Add state for parsed tasks and selected task indices
- After `guidance` is loaded, parse the `---ACTIONS---` block into a task array (title, priority, dueDays)
- Render a checklist section between the markdown and `RecoveryPlanActions` using the same visual pattern as `SuggestedTasksSection` (checkbox, title, priority badge, due date)
- Add select all / deselect all toggle
- Pass the selected tasks to `RecoveryPlanActions` as a new prop

### File 2: `src/components/dashboard/sales/RecoveryPlanActions.tsx`

- Accept an optional `selectedTasks` prop (array of action steps)
- Pass these through to `ImplementPlanDialog` as a new `preSelectedSteps` prop
- When `preSelectedSteps` are provided, the dialog uses them directly instead of re-parsing from markdown

### File 3: `src/components/dashboard/sales/ImplementPlanDialog.tsx`

- Accept optional `preSelectedSteps` prop
- When provided, skip the `extractActions` parsing entirely and use the pre-selected steps directly
- All existing routing logic (create tasks, share DM, clipboard) works unchanged

### Parser utility (inline in SalesGoalProgress)

Extracts from the `---ACTIONS---` block:
- Title and description from colon-separated format
- Assigns priority based on position (first = high, rest = medium)
- Assigns dueDays based on position (1-2 = 2 days, 3-4 = 5 days, 5+ = 7 days)

## What You'll See

The recovery plan dialog will now look like:

```text
[Plan markdown text - no ---ACTIONS--- block visible]

-----
AI SUGGESTED TASKS                    Select all
[x] Review the Schedule...           HIGH    Due in 2 days
[x] Brief the team on upsells...     MEDIUM  Due in 5 days
[ ] Run targeted SMS campaign...     MEDIUM  Due in 7 days
-----

[Save Plan]  [Remind Me]  [Let's Implement]
```

Unchecking a task excludes it from implementation. "Let's Implement" opens with only your curated selection.
