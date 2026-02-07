

# Comprehensive Feature Implementation Plan

## Overview

This plan covers the implementation of **four major features** in order of priority:

1. **Training Reminders** - Automated notifications for overdue/upcoming training deadlines
2. **Achievement Badges System** - Gamification with milestones and unlockable badges
3. **Team Challenges** - Manager-created competitions with leaderboards
4. **Shift Swap System** - Marketplace for trading shifts with approval workflow

---

## Feature 1: Training Reminders

### Purpose
Automate email and in-app notifications when team members have overdue or upcoming training deadlines, following the established pattern from `send-handbook-reminders`.

### Database Schema

```sql
-- No new tables needed - uses existing:
-- training_assignments (has due_date)
-- training_progress (tracks completion)
-- notifications (for in-app alerts)
-- email_templates (for email content)
```

### Email Template Entry

| template_key | subject | description |
|--------------|---------|-------------|
| `training_reminder` | `Training Due Soon: {{training_title}}` | Standard reminder |
| `training_overdue` | `OVERDUE: Complete Your Training` | Urgent reminder |

### Edge Function: `send-training-reminders`

**Logic Flow:**
1. Fetch all `training_assignments` with `due_date` in next 3 days OR past due
2. Cross-reference with `training_progress` to find incomplete
3. For each user with incomplete trainings:
   - Check `notification_preferences` (opt-out respect)
   - Insert in-app notification
   - Send email via Resend API

**Notification Types:**
- `training_due_soon` - 3 days before due date
- `training_overdue` - After due date passes

### Scheduling
- Run via pg_cron daily at 9:00 AM

### Files to Create

| File | Description |
|------|-------------|
| `supabase/functions/send-training-reminders/index.ts` | Edge function |

### Files to Modify

| File | Changes |
|------|---------|
| Database | Insert email templates |
| `supabase/config.toml` | Register function with `verify_jwt = false` |

---

## Feature 2: Achievement Badges System

### Purpose
Award badges for milestones like training completion, first sale, client milestones, and streak achievements. Extends the existing `leaderboard_achievements` system.

### Existing Infrastructure
The project already has:
- `leaderboard_achievements` table (badge definitions)
- `user_achievements` table (earned badges)
- `useLeaderboardAchievements` hook

### New Achievement Categories

| Key | Name | Trigger | Threshold |
|-----|------|---------|-----------|
| `training_first` | First Training Complete | Training progress | 1 video |
| `training_master` | Training Master | Training progress | All videos |
| `bell_first` | First Bell | Ring the bell | 1 bell |
| `bell_10` | Bell Ringer | Ring the bell | 10 bells |
| `bell_100` | Bell Champion | Ring the bell | 100 bells |
| `streak_7` | Week Warrior | Daily streak | 7 days |
| `streak_30` | Monthly Master | Daily streak | 30 days |
| `client_50` | Client Builder | Unique clients | 50 clients |
| `client_100` | Client Century | Unique clients | 100 clients |
| `retail_1000` | Retail Pro | Retail sales | $1,000 |
| `retail_5000` | Retail Star | Retail sales | $5,000 |
| `perfect_attendance` | Perfect Attendance | No missed days | 30 days |
| `team_player` | Team Player | Shift swaps helped | 5 swaps |

### Components to Build

**1. AchievementShowcaseCard.tsx**
- Displays earned badges on profile
- Shows locked badges with progress
- Animated unlock effect

**2. AchievementNotificationToast.tsx**
- Celebratory popup when badge earned
- Confetti animation
- Share to team option

**3. AchievementsConfigPanel.tsx** (Admin)
- CRUD for achievement definitions
- Enable/disable badges
- Adjust thresholds

### Achievement Trigger System

Create a centralized service to check and grant achievements:

```typescript
// src/services/achievementService.ts
export async function checkAndGrantAchievements(
  userId: string,
  context: {
    trainingCompleted?: number;
    bellsRung?: number;
    streakDays?: number;
    retailSales?: number;
    clientsServed?: number;
  }
) {
  // Check each achievement type against thresholds
  // Grant if criteria met and not already earned
}
```

### Integration Points

| Event | Location | Action |
|-------|----------|--------|
| Training video marked complete | `Training.tsx` | Check training badges |
| Bell rung | `RingTheBell.tsx` | Check bell badges |
| Daily completion | Program page | Check streak badges |
| Appointment completed | Schedule | Check client badges |
| Retail sale logged | POS integration | Check retail badges |

### Files to Create

| File | Description |
|------|-------------|
| `src/services/achievementService.ts` | Centralized achievement logic |
| `src/components/achievements/AchievementNotificationToast.tsx` | Unlock celebration |
| `src/components/achievements/AchievementProgressCard.tsx` | Progress display |
| `src/pages/dashboard/admin/AchievementsConfig.tsx` | Admin management |

### Files to Modify

| File | Changes |
|------|---------|
| Database | Insert new achievement definitions |
| `src/pages/dashboard/Training.tsx` | Trigger training achievements |
| `src/pages/dashboard/RingTheBell.tsx` | Trigger bell achievements |
| `src/components/dashboard/LeaderboardContent.tsx` | Display achievements |
| `src/pages/dashboard/MyProfile.tsx` | Show earned badges |

---

## Feature 3: Team Challenges

### Purpose
Allow managers to create time-limited competitions between team members or locations with leaderboards, progress tracking, and rewards.

### Database Schema

```sql
-- Challenge definitions
CREATE TABLE public.team_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL, -- 'individual', 'team', 'location'
  metric_type TEXT NOT NULL, -- 'bells', 'retail', 'new_clients', 'retention', 'training'
  goal_value NUMERIC,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'completed', 'cancelled'
  prize_description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  rules JSONB DEFAULT '{}'
);

-- Challenge participants
CREATE TABLE public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES team_challenges(id) ON DELETE CASCADE,
  user_id UUID, -- null for location-based
  location_id TEXT,
  team_name TEXT,
  current_value NUMERIC DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Challenge progress history (for charts)
CREATE TABLE public.challenge_progress_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES team_challenges(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES challenge_participants(id) ON DELETE CASCADE,
  value_at_snapshot NUMERIC,
  snapshot_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Challenge Types

| Type | Description | Example |
|------|-------------|---------|
| `individual` | Person vs person | Most bells this week |
| `team` | Named teams compete | Team A vs Team B retail sales |
| `location` | Location vs location | Salon location competition |

### Metric Types

| Metric | Data Source |
|--------|-------------|
| `bells` | `ring_the_bell_entries` |
| `retail` | `phorest_performance_metrics` |
| `new_clients` | `phorest_performance_metrics` |
| `retention` | `phorest_performance_metrics` |
| `training` | `training_progress` |

### Components to Build

**1. ChallengeCard.tsx**
- Active challenge display
- Progress bar
- Time remaining
- Current standings preview

**2. ChallengeLeaderboard.tsx**
- Full standings table
- Progress charts over time
- Trend indicators

**3. CreateChallengeWizard.tsx**
- Step 1: Basic info (title, description, dates)
- Step 2: Challenge type and metric
- Step 3: Participants/teams
- Step 4: Goals and prizes
- Step 5: Review and launch

**4. ChallengesDashboard.tsx**
- Active challenges grid
- Past challenges history
- Create new button (managers only)

### Edge Function: `update-challenge-standings`

Scheduled function to:
1. Calculate current values for all active challenges
2. Update `challenge_participants.current_value`
3. Recalculate ranks
4. Insert daily snapshot for trending

### Navigation Integration

Add to Management Hub under "Team Development":

```typescript
<ManagementCard
  href="/dashboard/admin/challenges"
  icon={Trophy}
  title="Team Challenges"
  description="Create and manage team competitions"
  colorClass="bg-yellow-500/10 text-yellow-600"
/>
```

### User-Facing Widget

Add challenge preview widget to Command Center for participants.

### Files to Create

| File | Description |
|------|-------------|
| `src/pages/dashboard/admin/ChallengesDashboard.tsx` | Challenge management |
| `src/pages/dashboard/admin/ChallengeDetail.tsx` | Single challenge view |
| `src/components/challenges/ChallengeCard.tsx` | Challenge preview card |
| `src/components/challenges/ChallengeLeaderboard.tsx` | Full standings |
| `src/components/challenges/CreateChallengeWizard.tsx` | Creation wizard |
| `src/components/challenges/ChallengeProgressChart.tsx` | Progress visualization |
| `src/hooks/useChallenges.ts` | Challenge data hooks |
| `supabase/functions/update-challenge-standings/index.ts` | Standings calculator |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/admin/ManagementHub.tsx` | Add Challenges card |
| `src/App.tsx` | Add routes |
| `src/components/dashboard/CommandCenter.tsx` | Add challenge widget |

---

## Feature 4: Shift Swap System

### Purpose
Enable team members to post and claim shift swaps with a manager approval workflow.

### Database Schema

```sql
-- Shift swap listings
CREATE TABLE public.shift_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  original_date DATE NOT NULL,
  original_start_time TIME NOT NULL,
  original_end_time TIME NOT NULL,
  location_id TEXT,
  swap_type TEXT NOT NULL, -- 'swap', 'cover', 'giveaway'
  reason TEXT,
  status TEXT DEFAULT 'open', -- 'open', 'claimed', 'pending_approval', 'approved', 'denied', 'cancelled', 'expired'
  claimer_id UUID,
  claimer_date DATE, -- for swap: the date claimer offers
  claimer_start_time TIME,
  claimer_end_time TIME,
  manager_id UUID,
  manager_notes TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Swap comments/messages
CREATE TABLE public.shift_swap_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id UUID REFERENCES shift_swaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Swap Types

| Type | Description | Flow |
|------|-------------|------|
| `swap` | Trade shifts with someone | Requester posts → Claimer offers their shift → Manager approves |
| `cover` | Need someone to cover | Requester posts → Claimer picks up → Manager approves |
| `giveaway` | Give away shift completely | Requester posts → Claimer claims → Manager approves |

### Status Flow

```text
open → claimed → pending_approval → approved/denied
  ↓
cancelled/expired
```

### Components to Build

**1. ShiftSwapMarketplace.tsx**
- Grid of available swaps
- Filter by date, location, type
- My requests tab
- My claims tab

**2. PostSwapDialog.tsx**
- Select shift from calendar
- Choose swap type
- Add reason (optional)
- Set expiration

**3. ClaimSwapDialog.tsx**
- View shift details
- For swaps: select shift to offer
- For covers: confirm pickup
- Add message

**4. SwapApprovalQueue.tsx** (Managers)
- Pending approvals list
- Requester/claimer details
- Approve/deny with notes
- Bulk actions

**5. SwapNotificationCard.tsx**
- In-app notification for swap updates
- Quick action buttons

### Notification Triggers

| Event | Notify |
|-------|--------|
| New swap posted | All eligible team members |
| Swap claimed | Requester |
| Pending approval | Manager |
| Approved | Both parties |
| Denied | Both parties |

### Edge Function: `expire-shift-swaps`

Daily cleanup:
1. Mark expired swaps (past expires_at)
2. Mark swaps where original_date has passed

### Files to Create

| File | Description |
|------|-------------|
| `src/pages/dashboard/ShiftSwapMarketplace.tsx` | Main marketplace page |
| `src/components/shifts/PostSwapDialog.tsx` | Create swap listing |
| `src/components/shifts/ClaimSwapDialog.tsx` | Claim a swap |
| `src/components/shifts/SwapCard.tsx` | Swap listing card |
| `src/components/shifts/SwapApprovalQueue.tsx` | Manager approval UI |
| `src/components/shifts/MySwapsPanel.tsx` | User's swaps list |
| `src/hooks/useShiftSwaps.ts` | Swap data hooks |
| `supabase/functions/expire-shift-swaps/index.ts` | Expiration cleanup |
| `supabase/functions/notify-shift-swap/index.ts` | Swap notifications |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/dashboard/admin/ManagementHub.tsx` | Add Swap Approvals card |
| `src/App.tsx` | Add routes |
| Sidebar config | Add Shift Swaps nav item |

---

## Implementation Order

### Phase 1: Training Reminders (1-2 hours)
1. Create `send-training-reminders` edge function
2. Insert email templates
3. Register in config.toml
4. Set up pg_cron schedule

### Phase 2: Achievement Badges (3-4 hours)
1. Insert new achievement definitions
2. Create achievement service
3. Build notification toast component
4. Integrate triggers into existing pages
5. Build admin config panel

### Phase 3: Team Challenges (4-5 hours)
1. Create database tables with RLS
2. Build challenge hooks and types
3. Create challenge components
4. Build creation wizard
5. Create standings update function
6. Add to Management Hub and routing

### Phase 4: Shift Swap System (4-5 hours)
1. Create database tables with RLS
2. Build swap hooks and types
3. Create marketplace page
4. Build post/claim dialogs
5. Build manager approval queue
6. Create notification and expiration functions
7. Add routing and navigation

---

## Technical Notes

### RLS Policies Pattern
All new tables follow established patterns:
- Users can view their own data
- Managers can view/manage all
- Super admins have full access

### Notification Integration
All features integrate with existing `notifications` table for in-app alerts.

### Email Templates
All email content stored in `email_templates` table for easy customization.

### Mobile Responsiveness
All new components designed mobile-first following existing patterns.

### Real-time Updates
Enable Supabase Realtime for:
- `team_challenges` - Live leaderboard updates
- `shift_swaps` - Instant swap notifications

