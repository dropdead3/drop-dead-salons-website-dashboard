
# Transform Meetings & Accountability into Dashboard Layout

## Current State

The page uses tabs to switch between sections:
- Schedule New (form)
- My Meetings (list)
- Requests (coach-only)
- My Commitments (coach-only, accountability items)
- Meeting Requests (manager-initiated)

## Proposed Transformation

Convert to a card-based dashboard layout matching the Management Hub pattern, with summary stats and quick-access cards.

---

## New Page Structure

```text
+--------------------------------------------------+
|  MEETINGS & ACCOUNTABILITY                        |
|  Schedule 1:1 meetings, track commitments...      |
+--------------------------------------------------+
|                                                   |
|  +------------------+  +------------------+       |
|  | Quick Stats Card |  | Quick Stats Card |       |
|  | Upcoming: 3      |  | Pending: 2       |       |
|  +------------------+  +------------------+       |
|                                                   |
|  SCHEDULE & MEETINGS                              |
|  +---------------+  +---------------+             |
|  | Schedule New  |  | My Meetings   |             |
|  | Request a 1:1 |  | View upcoming |             |
|  +---------------+  +---------------+             |
|                                                   |
|  COACHING (for managers)                          |
|  +---------------+  +---------------+  +-------+  |
|  | Requests      |  | Commitments   |  | Inbox |  |
|  | Pending: 2    |  | Active: 5     |  | 3 new |  |
|  +---------------+  +---------------+  +-------+  |
+--------------------------------------------------+
```

---

## Implementation Approach

### 1. Create Sub-Pages for Each Section

Each card will link to a dedicated route instead of switching tabs:

| Card | Route | Content |
|------|-------|---------|
| Schedule New | `/dashboard/schedule-meeting/new` | The existing form |
| My Meetings | `/dashboard/schedule-meeting/my-meetings` | List of user's meetings |
| Requests | `/dashboard/schedule-meeting/requests` | Coach's incoming requests |
| My Commitments | `/dashboard/schedule-meeting/commitments` | AccountabilityOverview |
| Meeting Requests | `/dashboard/schedule-meeting/inbox` | PendingMeetingRequests |

### 2. Transform Main Page to Dashboard

The main `/dashboard/schedule-meeting` route becomes a hub with:
- **Stats row**: Quick overview (upcoming meetings, pending requests, overdue commitments)
- **Card grid**: Clickable cards organized by category

### 3. Reuse ManagementCard Pattern

Use the same `ManagementCard` component pattern for consistency:
- Icon + title + description
- Badge with counts (e.g., "3 pending")
- Hover effect with chevron

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/dashboard/ScheduleMeeting.tsx` | Modify | Transform to dashboard hub with cards |
| `src/pages/dashboard/meetings/ScheduleNewMeeting.tsx` | Create | Form extracted to own page |
| `src/pages/dashboard/meetings/MyMeetings.tsx` | Create | Meetings list page |
| `src/pages/dashboard/meetings/CoachRequests.tsx` | Create | Incoming requests for coaches |
| `src/pages/dashboard/meetings/Commitments.tsx` | Create | Accountability overview page |
| `src/pages/dashboard/meetings/MeetingInbox.tsx` | Create | Meeting requests inbox |
| `src/App.tsx` | Modify | Add new routes |

---

## Card Definitions

### Schedule & Meetings Category

```tsx
<ManagementCard
  href="/dashboard/schedule-meeting/new"
  icon={CalendarPlus}
  title="Schedule Meeting"
  description="Request a 1:1 with a coach or manager"
  colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
/>

<ManagementCard
  href="/dashboard/schedule-meeting/my-meetings"
  icon={Calendar}
  title="My Meetings"
  description="View your scheduled and past meetings"
  stat={upcomingCount}
  statLabel="upcoming"
  colorClass="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
/>
```

### Coaching Category (Coach Only)

```tsx
<ManagementCard
  href="/dashboard/schedule-meeting/requests"
  icon={Inbox}
  title="Meeting Requests"
  description="Review and respond to meeting requests"
  stat={pendingRequestsCount}
  statLabel="pending"
  colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
/>

<ManagementCard
  href="/dashboard/schedule-meeting/commitments"
  icon={ClipboardList}
  title="My Commitments"
  description="Track promises made to team members"
  stat={activeCommitmentsCount}
  statLabel="active"
  colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
/>

<ManagementCard
  href="/dashboard/schedule-meeting/inbox"
  icon={MessageSquare}
  title="Meeting Inbox"
  description="Manager-initiated meeting requests"
  stat={inboxCount}
  statLabel="pending"
  colorClass="bg-green-500/10 text-green-600 dark:text-green-400"
/>
```

---

## Stats Query

Fetch counts for badges:

```tsx
const { data: stats } = useQuery({
  queryKey: ['meeting-hub-stats', user?.id],
  queryFn: async () => {
    // Fetch upcoming meetings count
    // Fetch pending requests count (for coaches)
    // Fetch active accountability items count
    // Fetch meeting inbox count
    return { upcoming, pendingRequests, activeItems, inboxPending };
  },
});
```

---

## Visual Result

- Page transforms from tab-based navigation to a clean dashboard grid
- Each section becomes its own focused page with back navigation
- Counts/badges show at-a-glance status on the hub
- Consistent with Management Hub styling
- Coach-specific cards only visible to admins/managers
- Sub-pages use PlatformPageContainer + back button pattern
