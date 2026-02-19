

## Organize Tasks by Date and Add Universal Search

### What changes

**1. Group active tasks by date sections**

Active tasks will be organized into clear date groups instead of a flat list:
- **Overdue** -- tasks with due dates before today (red accent)
- **Today** -- tasks due today
- **Tomorrow** -- tasks due tomorrow
- **Upcoming** -- tasks due later (grouped by date)
- **No Date** -- tasks without a due date

Each group gets a small date header label. Empty groups are hidden.

**2. Add a search bar that searches across all tasks**

A search input at the top of the card (below the header) that:
- Searches task titles and descriptions across active AND completed tasks
- When a search query is entered, the date grouping and completed toggle are replaced with a single flat list of matching results
- Each result shows its status (active/completed) and due date
- Clearing the search returns to the normal grouped view

### Files changed

**`src/components/dashboard/TasksCard.tsx`**
- Add a search state and search input below the header
- When search is active: show flat filtered results from all tasks (active + completed)
- When search is empty: show the new date-grouped active tasks view
- Group active tasks using `startOfDay` comparisons into Overdue / Today / Tomorrow / Upcoming / No Date sections
- Each section renders a small label header and its tasks
- Keep existing completed toggle, "show more" logic, and completed filters (visible only when not searching)

**`src/components/dashboard/TaskItem.tsx`**
- No structural changes; it already displays due dates and overdue indicators correctly

### Technical details

Grouping logic (in a `useMemo`):
```
const today = startOfDay(new Date())
const tomorrow = addDays(today, 1)

groups = {
  overdue: tasks where parseISO(due_date) < today,
  today: tasks where parseISO(due_date) equals today,
  tomorrow: tasks where parseISO(due_date) equals tomorrow,
  upcoming: tasks where parseISO(due_date) > tomorrow,
  noDate: tasks where due_date is null
}
```

Search logic: filter all tasks (active + completed) by `title.toLowerCase().includes(query)` or `description?.toLowerCase().includes(query)`.

