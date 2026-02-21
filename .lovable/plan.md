

## Remove Card Styling from Unselected "Today" Button

### Problem
The "Today" button always has a border and background (`bg-background border border-input`) even when another day is selected, making it look like a second selected item and confusing the user.

### Change

**File: `src/components/dashboard/schedule/ScheduleHeader.tsx`** (line 307)

Update the Today button's unselected state to match the other unselected day buttons -- plain text with no border or background, only gaining emphasis on hover.

| State | Current | New |
|-------|---------|-----|
| Today selected | `bg-primary text-primary-foreground shadow-sm` | No change |
| Today NOT selected | `bg-background border border-input text-foreground` | `text-muted-foreground hover:bg-accent hover:text-accent-foreground` |

This makes the unselected Today button visually identical to other unselected days (Sat, Sun, Tue, etc.), so only the truly selected day stands out.

