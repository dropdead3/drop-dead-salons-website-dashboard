

## Replace Date Input with Calendar Picker (Both Dialogs)

### Problem
The native `<input type="date">` doesn't render well in your dark theme and lacks a proper calendar dropdown experience. It also doesn't default to today.

### Changes

**1. `src/components/dashboard/EditTaskDialog.tsx`**
- Replace the `<Input type="date">` with a Popover + Calendar (Shadcn date picker pattern)
- Default `dueDate` to today's date when the dialog opens
- Format the selected date as "MMM d, yyyy" in the trigger button
- Store internally as a `Date` object, convert to ISO string on submit

**2. `src/components/dashboard/AddTaskDialog.tsx`**
- Same replacement: swap `<Input type="date">` for Popover + Calendar
- Default `dueDate` to today when the dialog opens
- Reset to today (not empty) when the form resets after submission

### Implementation Details
- Uses existing `Calendar` component from `@/components/ui/calendar` with `pointer-events-auto` class (required for dialogs)
- Uses existing `Popover`/`PopoverTrigger`/`PopoverContent` from `@/components/ui/popover`
- Uses `format` from `date-fns` for display formatting and `parseISO` for safe date parsing
- The calendar trigger button shows a `CalendarIcon` and the formatted date, matching the Shadcn date picker pattern
- Both dialogs get identical treatment for consistency

