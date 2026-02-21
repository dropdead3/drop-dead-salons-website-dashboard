
## Move Red Closure Dots to the Left of Day Labels

### Change

**File: `src/components/dashboard/schedule/ScheduleHeader.tsx`** (lines 336-357)

Currently the button layout is a vertical column (`flex-col items-center`):
```
  Sun
   22
   *      <-- red dot below
```

Change to: keep the vertical stack for label+date, but wrap the whole button content in a horizontal row so the red dot sits to the left of the label column:
```
 * Sun
    22
```

Specifically:
1. Change the button's inner content from three stacked children to a horizontal `flex items-center gap-1` wrapper containing:
   - The red dot (if closed) on the left
   - A vertical `flex-col items-center` div with the day label and date number on the right
2. Remove the old red dot that was below the date number
3. Keep all existing className logic, tooltips, and closed-day opacity unchanged

This is a ~5 line tweak to the button's inner JSX only.
