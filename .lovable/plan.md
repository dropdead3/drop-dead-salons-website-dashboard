
## Match Time Axis Background to Sidebar Color

### Problem
The time labels column (showing "9 AM", "10 AM", etc.) on the left side of the schedule uses a generic muted gray that doesn't match the sidebar. The user wants visual consistency between the sidebar and this time gutter.

### Changes

**File: `src/components/dashboard/schedule/DayView.tsx`**

1. **Time labels column** (line 633): Change `bg-muted/30` to `bg-sidebar`
2. **Week indicator header** (line 606): Change `bg-muted/70` to `bg-sidebar`

**File: `src/components/dashboard/schedule/WeekView.tsx`**

1. **Time labels column** (line 433): Change `bg-muted/10` to `bg-sidebar`

This uses the existing `sidebar` color token (`hsl(var(--sidebar-background))`), which is already defined in `tailwind.config.ts` and adapts per-theme (cream, rose, sage, ocean, platform) and per-mode (light/dark). No new CSS variables needed.
