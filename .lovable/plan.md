
# Coaching & Accountability System

## Overview

This feature transforms the existing basic 1:1 meeting scheduling into a comprehensive coaching and accountability platform. Coaches and leadership can log detailed meeting notes, create follow-up action items with reminders, track accountability goals, and send check-in reports to team members.

---

## Architecture

### Database Schema

```text
one_on_one_meetings (existing)
    │
    ├── meeting_notes (NEW)
    │   ├── Structured note-taking with templates
    │   ├── Private vs. shared visibility
    │   └── Rich text content
    │
    ├── accountability_items (NEW)
    │   ├── Action items with due dates
    │   ├── Check-in reminders
    │   ├── Completion tracking
    │   └── Status workflow
    │
    └── meeting_reports (NEW)
        ├── Generated check-in reports
        ├── Email delivery status
        └── Team member acknowledgment
```

---

## Database Tables

### 1. `meeting_notes`
Stores detailed, structured notes from each 1:1 meeting.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| meeting_id | UUID | References one_on_one_meetings |
| coach_id | UUID | The coach who wrote the note |
| content | TEXT | Rich text note content |
| topic_category | TEXT | Discussion topic (performance, goals, feedback, development, personal, other) |
| is_private | BOOLEAN | Private to coach only vs. shared with team member |
| created_at | TIMESTAMP | When note was created |
| updated_at | TIMESTAMP | Last modification |

### 2. `accountability_items`
Tracks action items and goals that need follow-up.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| meeting_id | UUID | Origin meeting (nullable for standalone items) |
| coach_id | UUID | Coach who created the item |
| team_member_id | UUID | Team member responsible |
| title | TEXT | Brief action item title |
| description | TEXT | Detailed description |
| due_date | DATE | When item should be completed |
| reminder_date | DATE | When to send reminder notification |
| reminder_sent | BOOLEAN | Track if reminder was sent |
| status | TEXT | pending, in_progress, completed, cancelled |
| priority | TEXT | low, medium, high |
| completed_at | TIMESTAMP | When marked complete |
| completion_notes | TEXT | Notes on completion |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update |

### 3. `meeting_reports`
Stores generated check-in reports sent to team members.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| meeting_id | UUID | References the meeting |
| coach_id | UUID | Who generated the report |
| team_member_id | UUID | Report recipient |
| report_content | TEXT | Compiled report content (markdown) |
| included_notes | JSONB | Which note IDs were included |
| included_items | JSONB | Which accountability items were included |
| sent_at | TIMESTAMP | When email was sent |
| acknowledged_at | TIMESTAMP | When team member acknowledged |
| created_at | TIMESTAMP | Creation timestamp |

---

## Feature Components

### 1. Enhanced Meeting Details Page
**Path:** `/dashboard/meeting/:id`

A dedicated page for viewing and managing a specific 1:1 meeting with:

- **Meeting Summary Header** - Date, time, participants, status
- **Notes Section** - Add/edit meeting notes with topic categorization
- **Accountability Items Panel** - Create and track action items
- **Report Generator** - Build and send check-in reports
- **Meeting History** - View past meetings with this team member

### 2. Coach Dashboard Tab (ScheduleMeeting.tsx enhancement)
Add a new **"Coaching Hub"** tab for coaches showing:

- Upcoming meetings with quick-access
- Pending accountability items across all team members
- Overdue items requiring follow-up
- Recent meeting activity

### 3. Meeting Notes Component
A rich note-taking interface with:

- Topic category selection (dropdown)
- Private/shared visibility toggle
- Auto-save functionality
- Note templates for common meeting types

### 4. Accountability Item Manager
Interface for creating and tracking accountability items:

- Create new items linked to meetings
- Set due dates and reminder dates
- Priority levels with visual indicators
- Status workflow (pending → in_progress → completed)
- Quick completion with notes

### 5. Check-in Report Builder
Generate and send summary reports:

- Select notes to include (respects privacy settings)
- Include open accountability items
- Preview before sending
- Email delivery via edge function
- Track acknowledgment

### 6. Team Member View
For team members to see their:

- Shared meeting notes
- Assigned accountability items
- Received check-in reports
- Acknowledgment actions

---

## Edge Functions

### 1. `send-accountability-reminders`
Scheduled function (daily via pg_cron) that:

- Queries accountability_items where reminder_date = today
- Sends notifications to both coach and team member
- Creates in-app notifications
- Sends email reminders if enabled
- Marks reminder_sent = true

### 2. `send-meeting-report`
Invoked when coach sends a check-in report:

- Compiles selected notes and accountability items
- Generates formatted email
- Sends via Resend
- Creates in-app notification for team member
- Records in meeting_reports table

### 3. `check-overdue-items`
Daily check for overdue accountability items:

- Finds items past due_date with status not completed
- Escalates to coach with notification
- Optional: sends gentle reminder to team member

---

## UI/UX Flow

### For Coaches (Admin/Manager)

1. **Schedule Meeting** - Use existing flow
2. **Conduct Meeting** - Meeting occurs
3. **Log Notes** - Open meeting details, add categorized notes
4. **Create Action Items** - Add accountability items with due dates
5. **Set Reminders** - Configure reminder dates for follow-up
6. **Send Report** - Generate and email check-in summary
7. **Track Progress** - Monitor item completion from dashboard

### For Team Members

1. **View Meeting History** - See past 1:1s
2. **Access Shared Notes** - Read non-private notes
3. **Track Action Items** - View assigned items and mark progress
4. **Acknowledge Reports** - Confirm receipt of check-in reports

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/send-accountability-reminders/index.ts` | Daily reminder edge function |
| `supabase/functions/send-meeting-report/index.ts` | Report email sender |
| `src/pages/dashboard/MeetingDetails.tsx` | Full meeting view with notes/items |
| `src/components/coaching/MeetingNotes.tsx` | Notes management component |
| `src/components/coaching/AccountabilityItems.tsx` | Action items manager |
| `src/components/coaching/ReportBuilder.tsx` | Check-in report generator |
| `src/components/coaching/TeamMemberAccountability.tsx` | Team member view of their items |
| `src/hooks/useMeetingNotes.ts` | Notes CRUD operations |
| `src/hooks/useAccountabilityItems.ts` | Accountability items hook |
| `src/hooks/useMeetingReports.ts` | Reports management hook |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/ScheduleMeeting.tsx` | Add Coaching Hub tab, link to meeting details |
| `src/hooks/useOneOnOneMeetings.ts` | Add meeting completion workflow |
| `src/components/dashboard/DashboardLayout.tsx` | Add coaching nav item if needed |

---

## Notification Types

| Type | Recipient | Trigger |
|------|-----------|---------|
| `accountability_reminder` | Coach + Team Member | reminder_date reached |
| `accountability_overdue` | Coach | due_date passed without completion |
| `meeting_report_received` | Team Member | Coach sends check-in report |
| `item_completed` | Coach | Team member marks item complete |

---

## Enhancement Suggestions

1. **Meeting Templates** - Pre-built agenda templates for coaching, performance reviews, goal-setting, etc.

2. **Goal Tracking Integration** - Link accountability items to larger quarterly/annual goals for team members

3. **Analytics Dashboard** - Track coaching effectiveness metrics:
   - Average items completed on time
   - Meeting frequency per team member
   - Topic distribution analysis
   - Trend tracking over time

4. **AI Meeting Summarizer** - Use the AI assistant to help coaches summarize notes or suggest action items based on discussion content

5. **Recurring Accountability Items** - Create repeating action items (e.g., weekly check-ins, monthly reviews)

6. **Progress Photos/Attachments** - Allow uploading evidence of completed work

7. **360-Degree Feedback** - Enable team members to add their own notes/reflections on meetings

8. **Calendar Integration** - Sync accountability due dates with external calendars

---

## Technical Considerations

- **RLS Policies**: Coaches can see all their meetings/notes; team members only see shared content
- **Email Templates**: Add new templates for accountability reminders and meeting reports
- **notification_preferences**: Add toggles for coaching-related notifications
- **Realtime**: Enable for accountability_items so status updates appear instantly

