
# Phase 3: Training Enhancements, Team Communication & Points Economy

## Overview

Phase 3 focuses on three major feature sets that extend existing functionality and add new communication capabilities:

1. **Training Hub Enhancements** - PDF certificates and comprehension quizzes
2. **Digital Daily Huddle Notes** - Pre-shift meeting notes and daily goals
3. **Points Economy System** - Gamified points for actions with a reward shop

---

## Feature 1: Training Hub Enhancements

### 1A. PDF Training Certificates

Generate downloadable certificates when team members complete all required trainings.

**Components:**
- `TrainingCertificateGenerator.tsx` - PDF generation using existing jsPDF pattern
- Certificate button on Training page when 100% complete
- Certificate design with:
  - Company branding
  - Team member name
  - Completion date
  - List of completed modules
  - Digital signature/seal

**Integration Points:**
- Add "Download Certificate" button to Training.tsx when progress is 100%
- Uses existing `jsPDF` library (already installed)

### 1B. Comprehension Quizzes

Optional quizzes attached to training videos to verify understanding.

**Database Schema:**
```sql
-- Quiz definitions
CREATE TABLE training_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES training_videos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  passing_score INTEGER DEFAULT 80, -- percentage
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Quiz questions
CREATE TABLE training_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES training_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice', -- 'multiple_choice', 'true_false'
  options JSONB, -- array of options for MC
  correct_answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0
);

-- User quiz attempts
CREATE TABLE training_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quiz_id UUID REFERENCES training_quizzes(id) ON DELETE CASCADE,
  score INTEGER,
  passed BOOLEAN,
  answers JSONB,
  completed_at TIMESTAMPTZ DEFAULT now()
);
```

**Components:**
- `QuizCard.tsx` - Quiz interface with questions
- `QuizResultsDialog.tsx` - Show score and pass/fail
- `QuizBuilder.tsx` - Admin quiz creation (in Training Hub)

---

## Feature 2: Digital Daily Huddle Notes

A system for managers to create and share daily pre-shift notes with the team.

### Purpose
- Document daily goals and focus areas
- Share important announcements before shifts
- Track recurring topics and action items
- Build team alignment and communication

### Database Schema

```sql
-- Daily huddle entries
CREATE TABLE daily_huddles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  huddle_date DATE NOT NULL DEFAULT CURRENT_DATE,
  location_id TEXT,
  created_by UUID NOT NULL,
  
  -- Content sections
  focus_of_the_day TEXT,
  sales_goals JSONB, -- { retail: number, service: number }
  announcements TEXT,
  birthdays_celebrations TEXT,
  training_reminders TEXT,
  wins_from_yesterday TEXT,
  
  -- Metadata
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(huddle_date, location_id)
);

-- Huddle acknowledgments (who read it)
CREATE TABLE huddle_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  huddle_id UUID REFERENCES daily_huddles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(huddle_id, user_id)
);

-- Huddle templates (for recurring formats)
CREATE TABLE huddle_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_id TEXT,
  template_content JSONB,
  is_default BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Components

**Admin/Manager:**
- `DailyHuddleEditor.tsx` - Create/edit huddle notes
- `HuddleTemplateManager.tsx` - Save and manage templates
- `HuddleHistoryList.tsx` - View past huddles

**Team Member:**
- `TodaysHuddleCard.tsx` - Dashboard widget showing today's notes
- `HuddleAcknowledgmentButton.tsx` - Mark as read
- `HuddleArchive.tsx` - Browse past huddles

### Pages
- `/dashboard/admin/daily-huddle` - Manager creation page
- Widget on Command Center for team members

### Notification Flow
- Option to send push/email when huddle published
- Acknowledgment tracking for accountability

---

## Feature 3: Points Economy System

A comprehensive points system that rewards actions throughout the platform.

### Concept
Team members earn points for positive actions:
- Completing training videos
- Ringing the bell
- Giving high fives
- Completing challenges
- Shift swaps (helping teammates)
- Perfect attendance streaks

Points can be redeemed for rewards in a "Reward Shop."

### Database Schema

```sql
-- Points ledger (all point transactions)
CREATE TABLE points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points INTEGER NOT NULL, -- positive for earn, negative for spend
  action_type TEXT NOT NULL, -- 'training_complete', 'bell_ring', 'high_five', 'challenge_win', 'shift_swap', 'reward_redeem'
  reference_id UUID, -- optional: the ID of related entity
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Point rules (how many points per action)
CREATE TABLE points_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL UNIQUE,
  points_awarded INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  max_daily INTEGER, -- optional daily cap
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rewards catalog
CREATE TABLE rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  category TEXT, -- 'time_off', 'merchandise', 'experience', 'recognition'
  quantity_available INTEGER, -- null = unlimited
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reward redemptions
CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reward_id UUID REFERENCES rewards_catalog(id),
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'fulfilled', 'denied'
  notes TEXT,
  manager_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  fulfilled_at TIMESTAMPTZ
);
```

### Default Point Values

| Action | Points |
|--------|--------|
| Complete training video | 10 |
| Ring the bell | 25 |
| Give a high five | 5 |
| Receive a high five | 2 |
| Win a challenge | 100 |
| Complete shift swap | 15 |
| 7-day streak | 50 |
| 30-day streak | 200 |

### Components

**User-Facing:**
- `PointsBalanceCard.tsx` - Shows current balance (dashboard widget)
- `PointsHistoryPanel.tsx` - Transaction history
- `RewardShop.tsx` - Browse and redeem rewards (`/dashboard/rewards`)
- `RewardCard.tsx` - Individual reward display
- `RedemptionConfirmDialog.tsx` - Confirm before spending points

**Admin:**
- `PointsConfigPanel.tsx` - Manage point rules
- `RewardsManager.tsx` - CRUD for rewards catalog
- `RedemptionQueue.tsx` - Approve/fulfill redemptions

### Integration Points

Modify existing files to award points:
- `Training.tsx` - Award points on video completion
- `RingTheBell.tsx` - Award points on bell ring
- `useShiftSwaps.ts` - Award points on swap approval
- `useChallenges.ts` - Award points on challenge completion

### Service Layer

```typescript
// src/services/pointsService.ts
export async function awardPoints(
  userId: string,
  actionType: string,
  referenceId?: string,
  description?: string
): Promise<{ success: boolean; pointsAwarded: number }> {
  // Fetch rule for action type
  // Check daily cap if applicable
  // Insert into points_ledger
  // Return result
}

export async function getUserPointsBalance(userId: string): Promise<number> {
  // Sum all points in ledger for user
}

export async function redeemReward(
  userId: string,
  rewardId: string
): Promise<{ success: boolean; error?: string }> {
  // Check balance
  // Check availability
  // Create redemption record
  // Deduct points
}
```

---

## Files to Create

| Category | File | Description |
|----------|------|-------------|
| Training | `src/components/training/TrainingCertificateButton.tsx` | Certificate download button |
| Training | `src/components/training/QuizCard.tsx` | Quiz taking interface |
| Training | `src/components/training/QuizBuilder.tsx` | Admin quiz creation |
| Training | `src/components/training/QuizResultsDialog.tsx` | Quiz results display |
| Huddle | `src/pages/dashboard/admin/DailyHuddle.tsx` | Manager huddle page |
| Huddle | `src/components/huddle/HuddleEditor.tsx` | Create/edit huddle |
| Huddle | `src/components/huddle/TodaysHuddleCard.tsx` | Dashboard widget |
| Huddle | `src/components/huddle/HuddleArchive.tsx` | Past huddles list |
| Huddle | `src/hooks/useHuddles.ts` | Huddle data hooks |
| Points | `src/pages/dashboard/RewardShop.tsx` | Browse rewards |
| Points | `src/pages/dashboard/admin/PointsConfig.tsx` | Admin config |
| Points | `src/components/points/PointsBalanceCard.tsx` | Balance widget |
| Points | `src/components/points/PointsHistoryPanel.tsx` | Transaction list |
| Points | `src/components/points/RewardCard.tsx` | Reward display |
| Points | `src/components/points/RedemptionQueue.tsx` | Admin approvals |
| Points | `src/services/pointsService.ts` | Points logic |
| Points | `src/hooks/usePoints.ts` | Points data hooks |

---

## Files to Modify

| File | Changes |
|------|---------|
| Database | Create new tables (quizzes, huddles, points) |
| `src/pages/dashboard/Training.tsx` | Add certificate button, quiz integration, point awards |
| `src/pages/dashboard/RingTheBell.tsx` | Award points on bell ring |
| `src/pages/dashboard/admin/ManagementHub.tsx` | Add Daily Huddle card |
| `src/components/dashboard/CommandCenter.tsx` | Add huddle widget, points widget |
| `src/App.tsx` | Add new routes |
| `src/components/dashboard/settings/SidebarLayoutEditor.tsx` | Add Rewards nav item |
| `src/hooks/useShiftSwaps.ts` | Award points on approval |
| `src/hooks/useChallenges.ts` | Award points on challenge win |

---

## Navigation Updates

### New Sidebar Items
- **Rewards** - `/dashboard/rewards` (for all team members)

### Management Hub Additions
- **Daily Huddle** - Under "Communications" category
- **Points & Rewards** - Under "Team Operations" category

---

## Implementation Order

### Step 1: Database Schema (All Tables)
Create all new tables with RLS policies in a single migration.

### Step 2: Points Economy Core
1. Create `pointsService.ts`
2. Create `usePoints.ts` hook
3. Build `PointsBalanceCard.tsx` widget
4. Build `RewardShop.tsx` page
5. Build admin `PointsConfig.tsx` and `RewardsManager.tsx`
6. Integrate point awards into existing features

### Step 3: Daily Huddle System
1. Create `useHuddles.ts` hook
2. Build `DailyHuddle.tsx` admin page
3. Build `HuddleEditor.tsx` component
4. Build `TodaysHuddleCard.tsx` widget
5. Add to Command Center and Management Hub

### Step 4: Training Enhancements
1. Build `TrainingCertificateButton.tsx`
2. Build quiz components
3. Add `QuizBuilder.tsx` to Training Hub
4. Integrate into Training page

### Step 5: Routing & Navigation
1. Update `App.tsx` with new routes
2. Update sidebar configuration
3. Update Management Hub cards

---

## Technical Notes

### Points Calculation Performance
- Use database function for balance calculation to avoid N+1 queries
- Consider caching balance in user profile for fast reads (update via trigger)

### Huddle Publishing
- Real-time subscription for instant team notification
- Email option via existing Resend integration

### Quiz Randomization
- Questions can be shuffled per attempt
- Store attempt details for analytics

### Reward Fulfillment
- Manager approval workflow
- Notification on status change
- Audit trail for accountability
