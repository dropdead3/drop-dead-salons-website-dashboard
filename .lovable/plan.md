

## Move Insights & Announcements to Their Own Row

### What changes

The "Zura Insights" and "Announcements" buttons will be pulled out of the right column of the welcome header and placed on their own full-width row beneath the welcome text/Customize row. The "Customize" button stays top-right, aligned with the welcome text.

### Layout (before -> after)

**Before:**
```text
| WELCOME BACK, ERIC          [Insights] [Announcements] [Customize] |
| Here's what's happening today                                       |
```

**After:**
```text
| WELCOME BACK, ERIC                                      [Customize] |
| Here's what's happening today                                        |
|                                                                      |
| [Zura Insights]  [Announcements]                                     |
```

### Technical detail

**File: `src/pages/dashboard/DashboardHome.tsx` (lines ~235-260)**

1. Keep the existing `flex items-start justify-between` row but only include the welcome text (left) and `DashboardCustomizeMenu` (right).
2. Add a new `div` row below, inside the same `motion.div`, containing the Insights and Announcements buttons side by side (`flex items-center gap-3`).
3. The border-bottom on the `motion.div` will naturally span beneath both rows, visually grouping them as a single header section.

