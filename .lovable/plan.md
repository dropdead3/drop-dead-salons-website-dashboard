
## Fix Calendar Icon Link in Top Navigation Bar

The calendar icon in the top navigation bar currently navigates to `/dashboard/calendar` (incorrect). It should navigate to `/dashboard/schedule` (the scheduling page). The tooltip text will also be updated from "Calendar" to "Schedule" for consistency.

### Changes

**File: `src/components/dashboard/DashboardLayout.tsx`** (2 line changes)
- Line 1140: Change `navigate('/dashboard/calendar')` to `navigate('/dashboard/schedule')`
- Line 1145: Change tooltip text from `Calendar` to `Schedule`
