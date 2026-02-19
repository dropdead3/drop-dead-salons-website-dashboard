

## Fix Tasks Card: Date Display Bug and Standard Card Styling

### Bug 1: Due dates showing one day early (Feb 18 instead of Feb 19)

**Root cause**: In `TaskItem.tsx`, line 106, the date is formatted using `new Date(task.due_date)` which interprets date-only strings (YYYY-MM-DD) as UTC midnight. In timezones behind UTC (like US timezones), this rolls the date back one day when displayed locally.

**Fix**: Replace `new Date(task.due_date)` with `parseISO(task.due_date)` in all `formatDate` calls within `TaskItem.tsx` (lines 106 and 112). `parseISO` correctly interprets date-only strings as local midnight per the project's established convention.

### Bug 2: Tasks card not using standard card styling

**Current**: The header uses `font-sans text-xs tracking-normal` with no icon -- inconsistent with every other dashboard card.

**Fix**: Update the `TasksCard.tsx` header to match the standard pattern:
- Add the `CheckSquare` icon in the standard `tokens.card.iconBox` container
- Change the title to use `tokens.card.title` (Termina, base size, tracked)
- Keep the active count badge and add task button

---

### Files changed

**`src/components/dashboard/TaskItem.tsx`** (lines 106, 112)
- Replace `new Date(task.due_date)` with `parseISO(task.due_date)` in both formatDate calls
- Replace `new Date(task.completed_at)` with `parseISO(task.completed_at)` for consistency

**`src/components/dashboard/TasksCard.tsx`** (lines 88-91)
- Import `tokens` from design tokens
- Add icon box with `CheckSquare` icon using `tokens.card.iconBox` and `tokens.card.icon`
- Change `h2` to use `tokens.card.title` class (Termina font, base size, tracking-wide)

