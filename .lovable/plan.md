

## Task Drilldown Detail View

### Overview
Add a drilldown dialog that opens when clicking on a task, showing full task details: title, description, priority, created date, due date, completion status, source, and timestamps. This follows the same drilldown pattern used by `LiveSessionDrilldown` and `DayProviderBreakdownPanel`.

### Gaps and Enhancements Identified
1. **No way to view full task details** -- clicking a task does nothing; description is hidden entirely
2. **No notes/activity log on tasks** -- the DB schema has no `notes` column beyond `description`; we should add a `notes` text field to the `tasks` table for ongoing task notes
3. **Tasks capped at 5 visible** -- the widget shows "X more tasks" but provides no way to see them all
4. **No overdue indicator** -- tasks past their due date have no visual warning
5. **Completed date not shown** -- `completed_at` exists in the DB but is never surfaced

### Changes

**1. Database Migration -- Add `notes` column to `tasks` table**
- `ALTER TABLE public.tasks ADD COLUMN notes text;`
- Allows users to add freeform notes distinct from the description

**2. New Component: `src/components/dashboard/TaskDetailDrilldown.tsx`**
- Full-width drilldown dialog using `DRILLDOWN_DIALOG_CONTENT_CLASS` for consistent styling
- Sections displayed:
  - Header with title, priority badge, and completion status toggle
  - Description (if present)
  - Notes field (editable inline textarea, auto-saves on blur)
  - Metadata grid: Created date, Due date (with overdue highlight), Completed date (if completed), Source badge (manual vs ai_insights)
- Footer with Edit and Delete action buttons
- Read-only mode support for impersonation

**3. Update `src/components/dashboard/TaskItem.tsx`**
- Make the task title/row clickable to open the drilldown (onClick handler)
- Add `onView` callback prop alongside existing `onEdit`
- Add overdue visual indicator (red text on due date when past due and not completed)

**4. Update `src/hooks/useTasks.ts`**
- Include `notes` in the `Task` type interface
- Add `notes` to the `updateTask` mutation's accepted fields

**5. Update `src/components/dashboard/EditTaskDialog.tsx`**
- Add a "Notes" textarea field to the edit form

**6. Wire in `src/pages/dashboard/DashboardHome.tsx`**
- Add `viewingTask` state (separate from `editingTask`)
- Pass `onView` to each `TaskItem`
- Render `TaskDetailDrilldown` with the selected task
- Pass through edit/delete/toggle handlers so drilldown can trigger actions
- When "Edit" is clicked inside drilldown, close drilldown and open `EditTaskDialog`

### Technical Details

**Drilldown Layout:**
```text
+---------------------------------------+
| [Priority dot] Task Title        [X]  |
| [checkbox] Mark as complete           |
+---------------------------------------+
| Description                           |
| "Some task description text..."       |
+---------------------------------------+
| Notes                                 |
| [editable textarea]          [Save]   |
+---------------------------------------+
| Created    Feb 19, 2026               |
| Due        Feb 21, 2026              |
| Completed  --                         |
| Source     Manual                      |
+---------------------------------------+
|              [Edit]  [Delete]         |
+---------------------------------------+
```

**Overdue logic:** `task.due_date && !task.is_completed && new Date(task.due_date) < today`

**Notes auto-save:** Textarea with a "Save" button that calls `updateTask.mutate({ id, updates: { notes } })`

