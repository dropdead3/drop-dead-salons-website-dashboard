

## Move Schedule Button from Top Bar to Sidebar

### What's happening now

The Schedule button currently lives in two places:
- **Top bar**: A CalendarDays/LayoutDashboard toggle icon that swaps between Command Center and Schedule (lines 1139-1157 of DashboardLayout.tsx)
- **Sidebar**: Already present as the second item under "Command Center" in the main nav section (defined in dashboardNav.ts)

### What changes

**1. Remove the schedule toggle button from the top bar**

Delete the CalendarDays/LayoutDashboard toggle button from the top navigation bar in `DashboardLayout.tsx` (the contextual swap button between lines 1139-1157). The back/forward arrows and other controls remain untouched.

**2. No sidebar changes needed**

The Schedule link already exists in the sidebar directly below Command Center as designed. No changes required there.

### Files changed

| File | Changes |
|------|---------|
| `src/components/dashboard/DashboardLayout.tsx` | Remove the schedule/command-center toggle button (the Tooltip block with CalendarDays icon) from the top bar left side controls |

This is a small, clean removal -- the sidebar already has the Schedule link in the correct position.
