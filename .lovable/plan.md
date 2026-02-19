

## Fix Remaining Overdue Logic in Tasks Card and Detail Drilldown

### Problem
The overdue fix was applied to `TaskItem.tsx` but two other files still use incorrect logic that marks tasks due today as overdue:
- **TasksCard.tsx**: The overdue count and sorting use `new Date(due_date) < new Date(today)` which incorrectly includes today
- **TaskDetailDrilldown.tsx**: Uses `isPast(startOfDay(parseISO(due_date)))` which returns true once midnight passes, marking today's tasks as overdue immediately

### Changes

**1. `src/components/dashboard/TasksCard.tsx`**
- Import `parseISO` and `startOfDay` from `date-fns`
- Replace `overdueCount` calculation (line 49) to use `startOfDay(parseISO(t.due_date)) < startOfDay(new Date())` (strictly before today)
- Replace sorting logic (lines 55-58) to use the same consistent comparison

**2. `src/components/dashboard/TaskDetailDrilldown.tsx`**
- Replace `isPast(startOfDay(parseISO(task.due_date)))` on line 54 with `startOfDay(parseISO(task.due_date)) < startOfDay(new Date())`
- Remove unused `isPast` import if no longer needed

### Result
All three task-related files will use identical overdue logic: a task is only overdue when its due date is strictly before today's date.

