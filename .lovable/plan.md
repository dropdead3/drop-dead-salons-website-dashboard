

# Category 4: Team Collaboration Enhancements - Implementation Plan

## Executive Summary

This plan implements three major collaboration features: **Unified @Mention Notifications**, a **Shared Team Calendar**, and **AI-Powered Daily Huddle Automation**. These features build on the existing robust infrastructure including the team chat system, notification preferences, push notification edge function, and huddle management system.

---

## Current State Analysis

### Existing Infrastructure

| Component | Status | Details |
|-----------|--------|---------|
| Team Chat | ✅ Full System | `MentionInput.tsx`, `MentionAutocomplete.tsx`, realtime messaging |
| @Mentions in Chat | ✅ Working | Format: `@[Name](userId)`, rendered with chips |
| Account Note Mentions | ✅ Working | `account_note_mentions` table, `useAccountNotes.ts` |
| Push Notifications | ✅ Working | `send-push-notification` edge function with VAPID |
| Notification Preferences | ✅ Working | `notification_preferences` table, per-type toggles |
| Daily Huddles | ✅ Working | `daily_huddles` table, `HuddleEditor.tsx`, templates |
| Smart Actions | ✅ Working | AI detection via `detect-chat-action` edge function |

### Key Gaps to Address

1. **Fragmented Mentions** - Chat mentions and account note mentions are separate systems
2. **No Push for Chat Mentions** - Mentions don't trigger push/email notifications
3. **No Mentions Inbox** - Users can't see all mentions in one place
4. **No Team Calendar** - No shared visibility into team events, time-off, or availability
5. **Manual Huddles Only** - No AI-assisted content generation for daily huddles

---

## Feature 1: Unified @Mention Notifications System

### Purpose
Create a centralized mentions system that tracks mentions across all sources (chat, notes, tasks, announcements) and triggers push/email notifications based on user preferences.

### Database Changes

```sql
-- Unified mentions tracking table
CREATE TABLE user_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_by UUID REFERENCES auth.users(id),
  source_type TEXT NOT NULL, -- 'chat', 'account_note', 'task', 'announcement'
  source_id UUID NOT NULL,
  channel_id UUID, -- For chat mentions
  source_context TEXT, -- Preview of the message (first 150 chars)
  read_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_mentions_user_unread ON user_mentions(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_user_mentions_source ON user_mentions(source_type, source_id);

ALTER TABLE user_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own mentions" ON user_mentions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users mark own mentions read" ON user_mentions
  FOR UPDATE USING (user_id = auth.uid());

-- Add mention notification preference
ALTER TABLE notification_preferences 
  ADD COLUMN IF NOT EXISTS mention_enabled BOOLEAN DEFAULT true;
```

### Edge Function: `process-mention-notifications`

```text
supabase/functions/process-mention-notifications/index.ts

Purpose: Process new mentions and send notifications

Invocation: Called by database trigger on chat_messages INSERT or 
            by mutation hooks for other mention sources

Input:
{
  sourceType: 'chat' | 'account_note' | 'task' | 'announcement',
  sourceId: string,
  content: string,
  authorId: string,
  organizationId: string,
  channelId?: string
}

Logic:
1. Parse mention format: @[Name](userId)
2. Extract all mentioned user IDs
3. For each mentioned user:
   a. Check if self-mention (skip)
   b. Fetch notification preferences
   c. Insert into user_mentions table
   d. If mention_enabled:
      - Send push notification via send-push-notification
      - If email_notifications_enabled: queue email
4. Return count of notifications sent

Integration:
- Modify useChatMessages sendMessage to call this after insert
- Modify useAccountNotes to call this after note creation
```

### Frontend Components

| Component | Location | Description |
|-----------|----------|-------------|
| `MentionsInbox.tsx` | `src/components/mentions/MentionsInbox.tsx` | Unified view of all mentions with tabs by source |
| `MentionNotificationBadge.tsx` | `src/components/mentions/MentionNotificationBadge.tsx` | Bell icon with unread count |
| `MentionContextCard.tsx` | `src/components/mentions/MentionContextCard.tsx` | Expandable preview with link to source |
| `useMentions.ts` | `src/hooks/useMentions.ts` | CRUD operations + realtime subscription |

### Hook Implementation

```typescript
// src/hooks/useMentions.ts
interface Mention {
  id: string;
  source_type: 'chat' | 'account_note' | 'task' | 'announcement';
  source_id: string;
  channel_id?: string;
  source_context: string;
  mentioned_by: string;
  read_at: string | null;
  created_at: string;
  author?: { full_name: string; photo_url: string };
}

export function useMentions(): {
  mentions: Mention[];
  unreadCount: number;
  markAsRead: (mentionId: string) => void;
  markAllAsRead: () => void;
  isLoading: boolean;
}

export function useUnreadMentionCount(): number
```

### UI Integration Points

1. **Header Badge**: Add `MentionNotificationBadge` to dashboard header near notifications
2. **Popover Inbox**: Click badge opens mentions popover with recent mentions
3. **Full Page**: Link to `/dashboard/mentions` for complete history
4. **Deep Links**: Each mention card links to the source message/note/task

---

## Feature 2: Shared Team Calendar

### Purpose
Provide a unified view of team events, time-off requests, training sessions, and important dates that all team members can see and managers can manage.

### Database Changes

```sql
-- Team calendar events (different from client appointments)
CREATE TABLE team_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  location_id TEXT, -- Optional: limit to specific location
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'meeting', 'training', 'time_off', 'holiday', 'special', 'reminder'
  start_date DATE NOT NULL,
  end_date DATE, -- For multi-day events
  start_time TIME, -- Null for all-day events
  end_time TIME,
  all_day BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'team', -- 'team', 'leadership', 'private'
  color TEXT, -- Hex color for display
  created_by UUID REFERENCES auth.users(id),
  attendees JSONB DEFAULT '[]', -- [{ userId, status: 'confirmed'|'tentative'|'declined' }]
  recurring_pattern JSONB, -- { frequency: 'weekly', interval: 1, days: [1,3,5], until: '2026-12-31' }
  metadata JSONB DEFAULT '{}', -- Extra data like time-off type, training module ID
  is_cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_team_calendar_date ON team_calendar_events(organization_id, start_date, end_date);
CREATE INDEX idx_team_calendar_type ON team_calendar_events(organization_id, event_type);

ALTER TABLE team_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members view calendar" ON team_calendar_events
  FOR SELECT USING (
    organization_id = public.get_user_organization(auth.uid())
    AND (
      visibility = 'team'
      OR visibility = 'leadership' AND public.is_coach_or_admin(auth.uid())
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "Managers manage calendar" ON team_calendar_events
  FOR ALL USING (
    organization_id = public.get_user_organization(auth.uid())
    AND public.is_coach_or_admin(auth.uid())
  );

-- Time-off requests integration
CREATE TABLE time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_event_id UUID REFERENCES team_calendar_events(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL, -- 'vacation', 'sick', 'personal', 'other'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied'
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
```

### Frontend Components

| Component | Location | Description |
|-----------|----------|-------------|
| `TeamCalendarPage.tsx` | `src/pages/dashboard/TeamCalendar.tsx` | Full-page calendar with month/week/day views |
| `TeamCalendarMini.tsx` | `src/components/calendar/TeamCalendarMini.tsx` | Compact widget for dashboard |
| `CalendarEventCard.tsx` | `src/components/calendar/CalendarEventCard.tsx` | Popover with event details |
| `CreateEventDialog.tsx` | `src/components/calendar/CreateEventDialog.tsx` | Modal for adding events |
| `TimeOffRequestDialog.tsx` | `src/components/calendar/TimeOffRequestDialog.tsx` | Request time off form |
| `EventTypeFilter.tsx` | `src/components/calendar/EventTypeFilter.tsx` | Filter by event types |
| `useTeamCalendar.ts` | `src/hooks/useTeamCalendar.ts` | CRUD operations |
| `useTimeOffRequests.ts` | `src/hooks/useTimeOffRequests.ts` | Time-off management |

### Calendar Views

```text
TEAM CALENDAR - February 2026
┌──────────────────────────────────────────────────────────┐
│ [Month] [Week] [Day]     < February 2026 >    [+ Event] │
├──────────────────────────────────────────────────────────┤
│ Su   Mo   Tu   We   Th   Fr   Sa                         │
│                              1                            │
│ 2    3    4    5    6    7    8                          │
│      ■    ■                   ●                          │
│ 9    10   11   12   13   14   15                         │
│           ■■■■■■■■■■■■■■■                                │
│           Sarah PTO                                       │
│ 16   17   18   19   20   21   22                         │
│      ▲                                                    │
│      Team Training                                        │
└──────────────────────────────────────────────────────────┘

Legend:
■ Meeting  ▲ Training  ● Holiday  ░ Time Off
```

### Integration Points

1. **Dashboard Widget**: Add mini calendar to Command Center
2. **Sidebar**: Add "Team Calendar" link to navigation
3. **Time-Off in Profile**: Link to request time-off from profile page
4. **Huddle Integration**: Show today's calendar events in daily huddle

---

## Feature 3: AI-Powered Daily Huddle Automation

### Purpose
Auto-generate pre-shift team huddle content using AI analysis of yesterday's performance, today's schedule, and relevant team information.

### Edge Function: `generate-daily-huddle`

```text
supabase/functions/generate-daily-huddle/index.ts

Purpose: Generate AI-assisted huddle content from analytics data

Schedule: 6:00 AM daily via pg_cron (or on-demand)

Input:
{
  organizationId: string,
  locationId?: string,
  huddleDate: string // YYYY-MM-DD
}

Data Gathering:
1. Yesterday's Sales Summary (from phorest_daily_sales_summary)
   - Total revenue vs goal
   - Service vs product breakdown
   - Comparison to same day last week
   
2. Yesterday's Operations (from phorest_appointments)
   - Total appointments
   - No-shows and cancellations
   - New vs returning clients
   
3. Top Performers (from sales data)
   - Highest revenue stylist
   - Most rebookings
   
4. Today's Schedule (from appointments)
   - Total appointments booked
   - Expected revenue
   - VIP clients visiting
   
5. Today's Celebrations (from employee_profiles)
   - Team birthdays
   - Work anniversaries
   
6. Active Alerts (from detected_anomalies)
   - Unacknowledged anomalies
   - Recent issues

AI Generation:
- Use Lovable AI (google/gemini-3-flash-preview)
- Prompt: Create engaging, motivational huddle content
- Structure output into predefined sections

Output (stored in JSONB):
{
  wins_from_yesterday: string,
  focus_of_the_day: string,
  announcements: string,
  birthdays_celebrations: string,
  training_reminders: string,
  sales_goals: { retail: number, service: number },
  ai_generated: true,
  generated_at: timestamp
}
```

### Database Changes

```sql
-- Add AI generation tracking to huddles
ALTER TABLE daily_huddles
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_sections JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS generation_source TEXT; -- 'manual', 'ai_full', 'ai_assisted'
```

### Frontend Enhancements

| Component | Changes |
|-----------|---------|
| `HuddleEditor.tsx` | Add "Generate with AI" button, show AI badge |
| `AIHuddleGenerator.tsx` | Modal showing AI generation progress |
| `HuddleSection.tsx` | Indicate which sections are AI-generated |
| `useAIHuddle.ts` | Hook to trigger and manage AI generation |

### UI Flow

```text
Daily Huddle Page
┌─────────────────────────────────────────────────────────────┐
│ DAILY HUDDLE - Feb 9, 2026                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [✨ Generate with AI]  [📝 Start Fresh]                    │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🎯 Focus of the Day                    [AI Generated] │ │
│  │ ─────────────────────────────────────────────────────│ │
│  │ Push retail bundles - we're 15% behind weekly goal!   │ │
│  │                                           [Edit] [✓]  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🏆 Yesterday's Wins                    [AI Generated] │ │
│  │ ─────────────────────────────────────────────────────│ │
│  │ • Total revenue: $4,850 (+12% vs last Saturday)       │ │
│  │ • Sarah hit $1,200 - highest single-day!              │ │
│  │ • 3 new client rebookings                             │ │
│  │                                           [Edit] [✓]  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🎂 Celebrations                        [AI Generated] │ │
│  │ ─────────────────────────────────────────────────────│ │
│  │ • Happy Birthday to Maria! 🎉                         │ │
│  │                                           [Edit] [✓]  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Save Draft]  [Save & Publish]                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Unified Mentions System (Week 1)
1. Create `user_mentions` table with RLS policies
2. Build `process-mention-notifications` edge function
3. Modify `useChatMessages` to call notification function on send
4. Create `useMentions` hook with realtime subscription
5. Build `MentionNotificationBadge` and popover inbox
6. Add mention preference to notification settings

### Phase 2: Team Calendar Foundation (Week 2)
1. Create `team_calendar_events` table with RLS
2. Create `time_off_requests` table
3. Build `useTeamCalendar` and `useTimeOffRequests` hooks
4. Create `TeamCalendarPage` with month view
5. Build `CreateEventDialog` with event type selection
6. Add calendar route and navigation link

### Phase 3: Calendar Features (Week 3)
1. Add week/day views to calendar
2. Build `TimeOffRequestDialog` and approval workflow
3. Create `TeamCalendarMini` widget for dashboard
4. Implement recurring events logic
5. Add calendar events to daily huddle display
6. Build `EventTypeFilter` with legend

### Phase 4: AI Huddle Generation (Week 4)
1. Build `generate-daily-huddle` edge function
2. Create `useAIHuddle` hook
3. Add "Generate with AI" button to `HuddleEditor`
4. Build `AIHuddleGenerator` modal with progress
5. Add AI section badges and edit capability
6. Optional: Set up pg_cron for automatic daily generation

---

## File Changes Summary

| Category | New Files | Modified Files |
|----------|-----------|----------------|
| Database | 1 migration | - |
| Edge Functions | 2 new | - |
| Hooks | 4 new | `useChatMessages.ts`, `useAccountNotes.ts` |
| Components | 12+ new | `HuddleEditor.tsx`, `DashboardLayout.tsx` |
| Pages | 2 new | `App.tsx` (routes) |

### New Files to Create

```text
supabase/functions/
├── process-mention-notifications/index.ts
└── generate-daily-huddle/index.ts

src/hooks/
├── useMentions.ts
├── useTeamCalendar.ts
├── useTimeOffRequests.ts
└── useAIHuddle.ts

src/components/mentions/
├── MentionsInbox.tsx
├── MentionNotificationBadge.tsx
└── MentionContextCard.tsx

src/components/calendar/
├── TeamCalendarMini.tsx
├── CalendarEventCard.tsx
├── CreateEventDialog.tsx
├── TimeOffRequestDialog.tsx
└── EventTypeFilter.tsx

src/components/huddle/
└── AIHuddleGenerator.tsx

src/pages/dashboard/
├── MentionsPage.tsx
└── TeamCalendar.tsx
```

---

## Technical Notes

1. **Mention Parsing**: Reuse existing `@[Name](userId)` format from chat
2. **Push Notifications**: Leverage existing `send-push-notification` with proper VAPID
3. **Realtime**: Subscribe to `user_mentions` for live badge updates
4. **Calendar Library**: Use existing date-fns + custom grid (no new deps)
5. **AI Gateway**: Use `google/gemini-3-flash-preview` via Lovable AI for huddle generation
6. **RLS**: All tables have organization-scoped policies with role checks

---

## Success Metrics

| Feature | KPI | Target |
|---------|-----|--------|
| Mentions | Response time to mentions | <2 hours avg |
| Mentions | Push notification delivery | >95% |
| Calendar | Events created per week | >5 per org |
| Calendar | Time-off requests submitted | >90% via system |
| AI Huddle | AI generation usage | >50% of huddles |
| AI Huddle | Edit rate after AI generation | <30% (quality indicator) |

