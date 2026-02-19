

## Task Management Enhancements

### Overview
Transform the "My Tasks" widget from a simple checklist into a polished task management experience with completion animations, a completed tasks archive, filtering, and several UX improvements.

### 1. Completion Animation (Fade + Slide Out)

When a task is checked off, animate it out with a satisfying fade + slide-up before removing it from the active list. Uses `framer-motion` `AnimatePresence` + `motion.div` wrapping each `TaskItem`.

- Brief 400ms delay after checking so the user sees the checkmark
- Then fade out + slide up over 300ms
- Task moves to the completed list automatically

### 2. Active vs Completed Split

Split the task query results into two lists on the frontend:
- **Active tasks** (shown by default, sorted by priority then due date)
- **Completed tasks** (hidden by default behind a toggle button)

Add a "Show completed (N)" / "Hide completed" toggle button at the bottom of the widget. When expanded, completed tasks appear below a subtle divider with muted styling.

### 3. Uncomplete (Reopen) a Task

Completed tasks in the archive will have the same checkbox -- unchecking moves the task back to the active list (with a reverse animation). This already works via the existing `toggleTask` mutation; it just needs to be wired into the completed list UI.

### 4. Filterable Completed Tasks

When the completed list is visible, show a small filter bar with:
- **Search** -- text filter on task title
- **Priority** -- filter by low / normal / high
- **Date range** -- filter by completion date (completed_at)

This keeps it lightweight since it's inline filtering on already-fetched data (no new queries).

### 5. Additional Enhancements

- **Task count badges** -- Show active count and overdue count in the header ("3 active, 1 overdue")
- **"View all" link** -- When more than 5 active tasks exist, the "X more tasks" text becomes a clickable expander to show all active tasks (not just first 5)
- **Overdue section** -- Overdue tasks pinned to the top of the active list with a subtle red left border

### Technical Changes

**`src/components/dashboard/TaskItem.tsx`**
- Wrap in `motion.div` with exit animation props
- Accept `isCompleting` state to trigger delayed removal

**`src/pages/dashboard/DashboardHome.tsx`**
- Split `tasks` into `activeTasks` and `completedTasks` using `useMemo`
- Add `showCompleted` boolean state
- Add `completedFilter` state (search text, priority, date range)
- Wrap task list in `AnimatePresence`
- Add "Show completed" toggle button
- Add filter bar (only visible when completed list is open)
- Add "View all" expander for active tasks beyond 5
- Add overdue count badge in header

**`src/components/dashboard/CompletedTasksFilter.tsx` (New)**
- Small inline filter bar component with search input, priority select, and date range
- Filters applied client-side on the completed tasks array

**No database changes needed** -- all data (is_completed, completed_at, priority) already exists.

### UX Details

- Animation uses `framer-motion` (already installed)
- Completed tasks show `completed_at` date instead of due date
- Completed tasks have a muted/faded appearance with strikethrough title
- Filter bar is minimal: a search input and two small dropdowns, matching the calm executive aesthetic
- Empty state for completed list: "No completed tasks yet"
- Empty state for filtered results: "No tasks match your filters"

