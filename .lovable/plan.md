

# Rename Navigation & Add Quick Link

## Overview

This update renames "Schedule 1:1 Meeting" to "Meetings & Accountability" throughout the application and adds a new quicklink to the Command Center for quick access.

---

## Changes

### 1. Rename Navigation Item

Update the label from "Schedule 1:1 Meeting" to "Meetings & Accountability" in:

| File | Location |
|------|----------|
| `src/components/dashboard/DashboardLayout.tsx` | Sidebar navigation items array |
| `src/components/dashboard/settings/SidebarPreview.tsx` | Preview route labels |
| `src/components/dashboard/settings/SidebarLayoutEditor.tsx` | Route label mapping |
| `src/pages/dashboard/ScheduleMeeting.tsx` | Page title and description |

### 2. Add Command Center Quick Link

Add a new entry to the `hubLinks` array in `HubQuickLinks.tsx`:

```typescript
{ 
  href: '/dashboard/schedule-meeting', 
  icon: CalendarClock, 
  label: 'Schedule 1:1', 
  colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20',
  permission: 'schedule_meetings',
}
```

This provides quick access directly from the Command Center hub grid.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardLayout.tsx` | Update label to "Meetings & Accountability" |
| `src/components/dashboard/settings/SidebarPreview.tsx` | Update label to "Meetings & Accountability" |
| `src/components/dashboard/settings/SidebarLayoutEditor.tsx` | Update label to "Meetings & Accountability" |
| `src/pages/dashboard/ScheduleMeeting.tsx` | Update page heading to "Meetings & Accountability" |
| `src/components/dashboard/HubQuickLinks.tsx` | Add CalendarClock import and new quicklink entry |

---

## Result

- Sidebar navigation shows "Meetings & Accountability"
- Page title reflects the broader scope of the feature
- Command Center displays a new "Schedule 1:1" quicklink with indigo styling for users with the `schedule_meetings` permission

