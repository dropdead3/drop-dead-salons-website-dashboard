

## Align Red Dots with Day Labels

### Change

**File: `src/components/dashboard/schedule/ScheduleHeader.tsx`** (lines 352-360)

Currently the red dot and the label+date column are siblings in a horizontal flex, which vertically centers the dot against both lines of text. Instead, move the dot inside the day label row so it sits at the same vertical position as "Sun" / "Mon":

**Current structure:**
```
[dot] [Sun]
       [22]
```

**New structure:**
```
[dot Sun]
  [22]
```

Specifically:
1. Remove the outer `flex items-center gap-1` wrapper
2. Change the inner `flex-col items-center` div back to being the direct button child
3. Replace the plain day label `<span>` with a `flex items-center gap-1` row containing the dot (if closed) and the label text
4. Date number stays on its own line below, unchanged

