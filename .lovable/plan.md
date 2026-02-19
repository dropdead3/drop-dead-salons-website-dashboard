

## Contextual Schedule/Command Center Icon in Top Nav

### What Changes
In the top navigation bar, the CalendarDays icon currently always links to `/dashboard/schedule`. When you're already on the schedule page, this is redundant. Instead, it should swap to a Command Center icon (LayoutDashboard) that navigates back to `/dashboard`.

### Implementation

**File: `src/components/dashboard/DashboardLayout.tsx` (~line 1139-1151)**

- Use `useLocation()` (already available) to check if the current path starts with `/dashboard/schedule`
- If on the schedule page: show `LayoutDashboard` icon, navigate to `/dashboard`, tooltip says "Command Center"
- If on any other page: keep current `CalendarDays` icon, navigate to `/dashboard/schedule`, tooltip says "Schedule"

This is a ~5-line conditional change in one file. No new components or dependencies needed.

### Technical Detail

```text
Before:
  [CalendarDays icon] --> always navigates to /dashboard/schedule

After:
  If on /dashboard/schedule:
    [LayoutDashboard icon] --> navigates to /dashboard (tooltip: "Command Center")
  Else:
    [CalendarDays icon] --> navigates to /dashboard/schedule (tooltip: "Schedule")
```
