

## Enhance Tasks: Recurring Tasks, Subtasks, and Snooze/Reminders

### Feature 1: Recurring Tasks

**Database changes** -- add columns to `tasks` table:
- `recurrence_pattern` TEXT (nullable) -- values: `daily`, `weekly`, `monthly`, or `null` for one-off tasks
- `recurrence_parent_id` UUID (nullable, self-referencing) -- links generated instances back to the original recurring task

**Logic**: When a recurring task is marked complete, a database trigger (`auto_create_next_recurring_task`) automatically inserts the next instance with the due date advanced by the appropriate interval. The new task copies title, description, priority, and recurrence_pattern from the completed one.

**UI changes**:
- `AddTaskDialog.tsx` and `EditTaskDialog.tsx`: Add a "Repeat" select field with options: None, Daily, Weekly, Monthly
- `TaskItem.tsx`: Show a small repeat icon (RefreshCw) next to recurring tasks
- `TaskDetailDrilldown.tsx`: Display recurrence pattern in the metadata grid

---

### Feature 2: Subtasks / Checklist Items

**Database changes** -- new `task_checklist_items` table:
- `id` UUID PK
- `task_id` UUID (FK to tasks, ON DELETE CASCADE)
- `title` TEXT NOT NULL
- `is_completed` BOOLEAN DEFAULT false
- `sort_order` INTEGER DEFAULT 0
- `created_at` TIMESTAMPTZ DEFAULT now()

RLS: Users can manage checklist items for their own tasks (join through tasks.user_id). Coaches can view all.

**UI changes**:
- `TaskDetailDrilldown.tsx`: Add a "Checklist" section between Description and Notes
  - Shows checklist items with checkboxes
  - Inline input to add new items
  - Delete button on hover
  - Progress indicator (e.g., "2/5 done")
- `TaskItem.tsx`: Show a small progress indicator (e.g., "2/5") when subtasks exist
- New hook: `useTaskChecklist(taskId)` -- fetches and mutates checklist items

---

### Feature 3: Snooze / Due Date Reminders

**Approach**: Client-side snooze that adjusts the due date. No backend notifications needed for Phase 1 -- keeps it simple and immediately useful.

**Database changes**: Add column to `tasks` table:
- `snoozed_until` DATE (nullable) -- when set, task is hidden from active view until this date

**UI changes**:
- `TaskItem.tsx`: Add a snooze button (on hover, next to edit/delete) for overdue and today tasks
- Snooze popover with quick options: "Tomorrow", "Next Week", "Pick a date"
- Snoozing sets `snoozed_until` on the task; the task is filtered out of the active view until that date arrives
- `TasksCard.tsx`: Filter active tasks to exclude snoozed tasks (where `snoozed_until > today`). Add a small "X snoozed" indicator that can be expanded to show snoozed tasks
- `TaskDetailDrilldown.tsx`: Show snooze status in metadata if snoozed

---

### Files changed

| File | Changes |
|------|---------|
| **Migration SQL** | Add `recurrence_pattern`, `recurrence_parent_id`, `snoozed_until` columns to `tasks`. Create `task_checklist_items` table with RLS. Create `auto_create_next_recurring_task` trigger function. |
| `src/hooks/useTasks.ts` | Update `Task` interface with new fields. Add snooze mutation. |
| `src/hooks/useTaskChecklist.ts` | **New file** -- CRUD hook for checklist items. |
| `src/components/dashboard/AddTaskDialog.tsx` | Add recurrence select field. |
| `src/components/dashboard/EditTaskDialog.tsx` | Add recurrence select field. |
| `src/components/dashboard/TaskItem.tsx` | Add repeat icon, subtask progress, snooze button with popover. |
| `src/components/dashboard/TaskDetailDrilldown.tsx` | Add checklist section, recurrence display, snooze status in metadata. |
| `src/components/dashboard/TasksCard.tsx` | Filter out snoozed tasks, add snoozed count indicator. |

### Sequencing

1. Database migration (all schema changes in one migration)
2. `useTaskChecklist` hook
3. Update `useTasks` hook (interface + snooze mutation)
4. Update Add/Edit dialogs (recurrence field)
5. Update TaskItem (repeat icon, subtask count, snooze button)
6. Update TaskDetailDrilldown (checklist section, recurrence + snooze metadata)
7. Update TasksCard (snoozed filter + indicator)

