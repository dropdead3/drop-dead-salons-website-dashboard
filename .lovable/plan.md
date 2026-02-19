

## Add Edit Task Feature

### Overview
Add an inline edit capability to each task in the "My Tasks" widget. Clicking a task (or an edit icon) opens a dialog pre-filled with the task's current values, allowing the user to update title, description, due date, and priority.

### Changes

**1. `src/hooks/useTasks.ts` -- Add `updateTask` mutation**
- New mutation that calls `supabase.from('tasks').update(...)` with title, description, due_date, and priority fields
- Blocked during impersonation (same pattern as create/toggle/delete)
- Invalidates `['tasks']` query on success
- Shows toast on success/error

**2. `src/components/dashboard/EditTaskDialog.tsx` -- New component**
- Reuses the same form layout as `AddTaskDialog` (title, description, due date, priority)
- Accepts a `task` prop to pre-fill all fields
- Accepts `onSave` callback and `isPending` state
- Controlled `open`/`onOpenChange` props (no trigger button -- opened externally)

**3. `src/components/dashboard/TaskItem.tsx` -- Add edit trigger**
- Add a `Pencil` icon button next to the delete button (visible on hover, same pattern)
- Add `onEdit` callback prop
- Clicking the pencil calls `onEdit(task)`

**4. `src/pages/dashboard/DashboardHome.tsx` -- Wire it together**
- Track `editingTask` state
- Pass `onEdit` to each `TaskItem`
- Render `EditTaskDialog` with the selected task
- Call `updateTask.mutate(...)` on save

### Technical Details
- The update mutation will send only changed fields to the database
- Read-only / impersonation guards follow the existing pattern (edit icon hidden, mutation throws)
- No database migration needed -- the `tasks` table already has all required columns
