
# Add Manager Meeting Request to Dashboard

## Current State

The ability to send meeting requests to team members already exists, but it's only accessible in the **Meeting Inbox** sub-page. Managers/admins have to navigate to that page to use the `ManagerMeetingRequest` dialog.

## Proposed Changes

Add the "Request Meeting" button directly to the main **Meetings & Accountability** dashboard header, alongside the existing "Schedule Meeting" and "Meeting Inbox" buttons - but only visible for coaches/admins.

---

## Visual Layout (After)

```text
+------------------------------------------------------------------+
| MEETINGS & ACCOUNTABILITY                                         |
| Schedule 1:1 meetings, track commitments...                       |
|                                                                   |
|   [Schedule Meeting]  [Request Meeting]*  [Meeting Inbox (3)]     |
|                                                                   |
|   * Only visible for coaches/admins                               |
+------------------------------------------------------------------+
```

---

## Implementation

### 1. Import the Component

Add the `ManagerMeetingRequest` component to the ScheduleMeeting dashboard page.

### 2. Add to Header Actions

Place it in the header actions row, between "Schedule Meeting" and "Meeting Inbox":

```tsx
<div className="flex flex-wrap gap-3 sm:shrink-0">
  <Link to="/dashboard/schedule-meeting/new">
    <Button className="gap-2">
      <CalendarPlus className="w-4 h-4" />
      Schedule Meeting
    </Button>
  </Link>
  
  {/* NEW - Only for coaches/admins */}
  {isCoach && <ManagerMeetingRequest />}
  
  <Link to="/dashboard/schedule-meeting/inbox">
    <Button variant="outline" className="gap-2">
      <MessageSquareMore className="w-4 h-4" />
      Meeting Inbox
      {stats.inboxPending > 0 && (
        <Badge variant="secondary">{stats.inboxPending}</Badge>
      )}
    </Button>
  </Link>
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/ScheduleMeeting.tsx` | Import and add `ManagerMeetingRequest` component to header actions |

---

## Button Behavior

The `ManagerMeetingRequest` component already:
- Opens a dialog to select a team member
- Allows specifying reason, priority, and optional deadline
- Sends a notification to the team member
- The team member sees the request in their "Meeting Inbox"

No additional database changes needed - the `meeting_requests` table and hooks are already in place.
