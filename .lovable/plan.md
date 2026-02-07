
# Leadership Accountability Overview & Meeting Request System

## Overview

This feature adds three key capabilities to the coaching system:

1. **Accountability Overview** - A dedicated dashboard for leadership showing all accountability items they've committed to help stylists with
2. **Meeting Request System** - Allow managers to request that stylists schedule a meeting with them
3. **New Meeting Type** - Add "Success Alignment Session" (SAS) to meeting types

---

## Feature Details

### 1. Accountability Overview Tab

A new **"My Commitments"** tab in the Schedule Meeting page for coaches/managers showing:

- All accountability items where they are the coach, grouped by team member
- Filter by status (pending, in progress, overdue, completed)
- Quick view of due dates and priorities
- Easy navigation to the meeting where each item was created
- Summary stats (total items, overdue count, completion rate)

This flips the perspective - instead of "what I assigned to stylists," it shows "what I promised to help stylists achieve."

### 2. Manager-Initiated Meeting Requests

New database table and UI flow allowing managers to request a stylist schedules a meeting:

**Flow:**
1. Manager selects a team member and creates a "meeting request"
2. System sends a notification to the stylist
3. Stylist sees the request in their Schedule Meeting page
4. Stylist schedules the actual meeting (selecting date/time)
5. Flow continues with normal meeting confirmation

This is different from the current flow where only stylists initiate meetings.

### 3. Success Alignment Session (SAS) Meeting Type

Add new meeting type with value `sas` and label "Success Alignment Session (SAS)" to the existing meeting types list.

---

## Database Changes

### New Table: `meeting_requests`

Tracks manager-initiated requests for team members to schedule meetings.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| manager_id | UUID | Manager who requested the meeting |
| team_member_id | UUID | Stylist who should schedule |
| reason | TEXT | Why the meeting is being requested |
| priority | TEXT | low, medium, high, urgent |
| status | TEXT | pending, scheduled, cancelled, expired |
| linked_meeting_id | UUID | The meeting created in response (nullable) |
| expires_at | DATE | Optional deadline to schedule by |
| created_at | TIMESTAMP | When request was created |
| updated_at | TIMESTAMP | Last update |

### Modification: Add meeting type

No schema change needed - meeting_type is already a TEXT field. Just update the frontend constants.

---

## Component Changes

### 1. Update `src/pages/dashboard/ScheduleMeeting.tsx`

**Add new tab: "My Commitments"** (visible only to coaches)
- Shows accountability items where coach_id = current user
- Grouped by team member with avatar + name headers
- Each item shows: title, due date, priority, status
- Click to navigate to meeting details
- Stats header: X active items, Y overdue

**Add new tab: "Meeting Requests"** (visible to all)
- For managers: show requests they've sent
- For stylists: show requests awaiting their scheduling

**Update meeting types constant:**
```typescript
const meetingTypes = [
  { value: 'coaching', label: 'Coaching Session' },
  { value: 'check_in', label: 'Check-in' },
  { value: 'feedback', label: 'Feedback Review' },
  { value: 'sas', label: 'Success Alignment Session (SAS)' },
  { value: 'other', label: 'Other' },
];
```

### 2. Update `src/pages/dashboard/MeetingDetails.tsx`

Add SAS to meeting types map for display.

### 3. Create `src/components/coaching/ManagerMeetingRequest.tsx`

Dialog/form for managers to:
- Select team member from directory
- Enter reason for meeting request
- Set priority level
- Optionally set deadline

### 4. Create `src/components/coaching/PendingMeetingRequests.tsx`

Card showing:
- For stylists: pending requests from managers to schedule
- For managers: status of requests they've sent

### 5. Create `src/components/coaching/AccountabilityOverview.tsx`

Dashboard component showing all commitments:
- Stats bar: total active, overdue, completed this week
- Team member sections with their items
- Filter and sort controls
- Quick status update capabilities

---

## New Hooks

### `src/hooks/useMeetingRequests.ts`

- `useMeetingRequests()` - Fetch requests for current user
- `useCreateMeetingRequest()` - Manager creates request
- `useUpdateMeetingRequestStatus()` - Update status
- `useLinkMeetingToRequest()` - Connect scheduled meeting to request

---

## Notification Integration

When a manager creates a meeting request:

1. Insert into `notifications` table:
   - user_id: team_member_id
   - type: `meeting_request`
   - title: "{Manager Name} has requested a meeting"
   - message: "{Reason}"
   - link: `/dashboard/schedule-meeting?tab=requests`

2. Stylist sees notification in bell menu
3. Clicking navigates to schedule meeting with request context

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useMeetingRequests.ts` | CRUD operations for meeting requests |
| `src/components/coaching/AccountabilityOverview.tsx` | Leadership commitments dashboard |
| `src/components/coaching/ManagerMeetingRequest.tsx` | Request meeting dialog |
| `src/components/coaching/PendingMeetingRequests.tsx` | View pending requests |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/ScheduleMeeting.tsx` | Add tabs, update meeting types |
| `src/pages/dashboard/MeetingDetails.tsx` | Add SAS to type map |
| `src/hooks/useOneOnOneMeetings.ts` | Add hook to link meeting to request |
| `src/hooks/useAccountabilityItems.ts` | Add hook for coach overview query |

---

## UI Flow Summary

### Manager Creating Meeting Request

1. Open Schedule Meeting page
2. Click "Request Meeting" button (new)
3. Select team member from dropdown
4. Enter reason and priority
5. Submit - notification sent to stylist

### Stylist Responding to Request

1. See notification in bell
2. Navigate to Schedule Meeting
3. See "Pending Requests" section
4. Click "Schedule" on a request
5. Normal meeting scheduling flow (with manager pre-selected)
6. Meeting linked to original request

### Manager Viewing Commitments

1. Open Schedule Meeting page
2. Click "My Commitments" tab
3. See all accountability items organized by team member
4. Filter by status, click to see meeting context
5. Track overdue items easily

---

## Technical Notes

### RLS Policies for meeting_requests

- Managers can create requests where manager_id = their user_id
- Team members can view requests where team_member_id = their user_id
- Managers can view their own requests
- Only team member can update status to 'scheduled'
- Only manager can cancel

### Integration Points

- Accountability items already have coach_id - reuse for overview
- Notifications table already exists - add new type
- Team directory hook available for member selection
