

## Fix: Tasks Due Today Should Not Show as Overdue

### Problem
The current overdue logic compares `new Date(task.due_date)` against the start of today. Due to UTC vs local timezone interpretation of date-only strings (YYYY-MM-DD), tasks due today can incorrectly appear as overdue.

### Fix (Single file: `src/components/dashboard/TaskItem.tsx`, line 43-44)

Use `parseISO` from `date-fns` (per project convention) to safely parse the due date as local midnight, then compare against today's local date start. A task is only overdue if its due date is strictly before today's date (not equal to today).

```text
Before:
  const isOverdue = new Date(task.due_date) < new Date(new Date().toDateString())

After:
  const today = startOfDay(new Date())
  const dueLocal = startOfDay(parseISO(task.due_date))
  const isOverdue = dueLocal < today   // strictly before today, not equal
```

This ensures tasks due today remain "due today" until the day is over, and only become overdue starting tomorrow.

### Dependencies
- `parseISO` and `startOfDay` from `date-fns` (already installed)
- No new files or packages needed
