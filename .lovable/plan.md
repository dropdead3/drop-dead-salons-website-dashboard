

# Default Gender to Female and Reorder Options

## Changes

**File:** `src/components/dashboard/schedule/NewClientDialog.tsx`

Three small edits:

1. **Line 78** -- Change default state from `''` to `'Female'` so the dialog opens with Female pre-selected
2. **Line 107** -- Change the reset value from `''` to `'Female'` so closing/reopening the dialog also defaults to Female
3. **Line 230** -- Reorder the array from `['Male', 'Female', 'Non-Binary', 'Prefer not to say']` to `['Female', 'Male', 'Non-Binary', 'Prefer not to say']` so Female appears first in the pill row

No other files affected.

