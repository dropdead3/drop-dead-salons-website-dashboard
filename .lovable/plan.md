
# Transform Meetings & Accountability into a Dashboard Overview

## Current State

The page currently shows navigation cards that link to sub-pages, but lacks actual data visualization. You want a dashboard overview similar to the main dashboard with data cards showing real metrics.

## Proposed Layout

```text
+--------------------------------------------------+
|  MEETINGS & ACCOUNTABILITY                        |
|  Schedule 1:1 meetings, track commitments...      |
+--------------------------------------------------+
|                                                   |
|  OVERVIEW STATS (data cards row)                  |
|  +-------------+ +-------------+ +-------------+  |
|  | Upcoming    | | Pending     | | Active      |  |
|  | Meetings    | | Requests    | | Commitments |  |
|  |     3       | |     2       | |     5       |  |
|  +-------------+ +-------------+ +-------------+  |
|                                                   |
|  UPCOMING MEETINGS (list preview)                 |
|  +---------------------------------------------+  |
|  | Today 2:00 PM - Coaching w/ Sarah           |  |
|  | Tomorrow 10:00 AM - Check-in w/ Mike        |  |
|  | Feb 12 - Feedback w/ Lisa                   |  |
|  | View All Meetings →                         |  |
|  +---------------------------------------------+  |
|                                                   |
|  [For Coaches Only]                               |
|  PENDING REQUESTS              ACTIVE COMMITMENTS |
|  +--------------------+       +----------------+  |
|  | Mike - Coaching    |       | Sarah: Follow  |  |
|  | Lisa - Feedback    |       |   up on goals  |  |
|  | View All →         |       | View All →     |  |
|  +--------------------+       +----------------+  |
|                                                   |
|  QUICK ACTIONS                                    |
|  [Schedule Meeting] [Meeting Inbox]               |
+--------------------------------------------------+
```

---

## Implementation Approach

### 1. Stats Overview Row

Create a row of quick stats cards similar to `OperationsQuickStats`:

| Stat | Icon | Color | Data Source |
|------|------|-------|-------------|
| Upcoming Meetings | Calendar | Blue | `one_on_one_meetings` where date >= today |
| Pending Requests (coach) | Inbox | Amber | `one_on_one_meetings` where coach_id = user and status = pending |
| Active Commitments (coach) | ClipboardList | Purple | `accountability_items` where status = pending |
| Inbox Pending | MessageSquare | Green | `meeting_requests` where team_member = user |

### 2. Upcoming Meetings Preview

Show the next 3-5 upcoming meetings as a compact list within a card:
- Date, time, meeting type, and coach/requester name
- "View All Meetings" link at the bottom

### 3. Coaching Section (Coaches Only)

Two side-by-side cards:

**Pending Requests Card:**
- Show 3-5 most recent pending meeting requests
- Quick approve/decline actions
- "View All Requests" link

**Active Commitments Card:**
- Show 3-5 active accountability items with due dates
- Color-code overdue items
- "View All Commitments" link

### 4. Quick Actions Row

Compact action buttons at the bottom:
- Schedule New Meeting
- Meeting Inbox

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/ScheduleMeeting.tsx` | Complete redesign to dashboard overview with data cards |

---

## Component Structure

### Stats Section
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center rounded">
        <Calendar className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <p className="text-2xl font-display">{stats.upcomingMeetings}</p>
        <p className="text-xs text-muted-foreground">Upcoming</p>
      </div>
    </div>
  </Card>
  {/* ... more stat cards */}
</div>
```

### Upcoming Meetings Preview
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-sm font-display">UPCOMING MEETINGS</CardTitle>
  </CardHeader>
  <CardContent>
    {upcomingMeetings.slice(0, 5).map(meeting => (
      <div className="flex items-center justify-between py-2 border-b last:border-0">
        <div>
          <span className="font-medium">{format(meeting.date, 'MMM d')}</span>
          <span className="text-muted-foreground"> - {meeting.type}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          with {meeting.coach.name}
        </span>
      </div>
    ))}
    <Link to="/dashboard/schedule-meeting/my-meetings">
      <Button variant="ghost" className="w-full mt-2">
        View All Meetings <ChevronRight />
      </Button>
    </Link>
  </CardContent>
</Card>
```

### Coaching Cards Grid
```tsx
{isCoach && (
  <div className="grid lg:grid-cols-2 gap-6">
    {/* Pending Requests Card */}
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <Inbox className="w-4 h-4" />
          PENDING REQUESTS
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingRequests.slice(0, 3).map(req => (...))}
        <Link to="/dashboard/schedule-meeting/requests">
          View All Requests
        </Link>
      </CardContent>
    </Card>

    {/* Active Commitments Card */}
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          ACTIVE COMMITMENTS
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeCommitments.slice(0, 3).map(item => (...))}
        <Link to="/dashboard/schedule-meeting/commitments">
          View All Commitments
        </Link>
      </CardContent>
    </Card>
  </div>
)}
```

---

## Data Queries

The page will fetch:

1. **Upcoming meetings** (full data, not just count)
2. **Pending requests** (as coach)
3. **Active accountability items** (as coach)
4. **Meeting inbox count**

This allows displaying actual meeting previews rather than just navigation cards.

---

## Visual Result

- Page transforms from a simple navigation hub to a rich dashboard overview
- Users immediately see their upcoming meetings and key metrics
- Coaches get at-a-glance view of pending requests and commitments
- Quick actions remain available at the bottom
- Consistent with other dashboard overview patterns in the app
