
## Make 15-Minute Grid Lines Theme-Aware

### Problem
The quarter-hour (:15, :45) grid lines use a fixed opacity (`border-border/35`) that doesn't adapt well to both light and dark modes -- too faint in light mode, potentially too strong in dark mode.

### Change

**File: `src/components/dashboard/schedule/DayView.tsx`** (line 134)

Replace the static opacity class with theme-responsive classes using Tailwind's `dark:` modifier:

| Line Type | Current | New |
|-----------|---------|-----|
| Quarter-hour (:15, :45) | `border-border/35` | `border-border/50 dark:border-border/30` |
| Half-hour (:30) | `border-border/60` | `border-border/70 dark:border-border/50` |

This makes the subdivider lines:
- **Darker in light mode** (increased from /35 to /50 for quarter-hour, /60 to /70 for half-hour) for better visibility
- **Lighter in dark mode** (appropriate reduced opacity to avoid harshness against dark backgrounds)
