

# Auto-DM Welcome Messages for New Team Members

## Overview

This feature allows organization admins to configure automatic welcome DMs that are sent from designated team members (e.g., Manager, Admin, HR) when a new employee joins the team. The welcome message creates a personal connection and gives new hires a direct line to key contacts.

## Feature Design

### Core Concept
When a new team member is approved, the system automatically:
1. Creates a DM conversation between the new member and designated welcome senders
2. Sends a pre-configured welcome message from each sender
3. Uses dynamic variables like `[sender_name]`, `[new_member_name]`, `[role]`

### Configuration Interface

A new **"Welcome DMs"** tab in Team Chat Settings with:

| Setting | Description |
|---------|-------------|
| Enable Auto Welcome DMs | Master toggle to enable/disable the feature |
| Welcome Senders | Multi-select of team members who will send welcome DMs |
| Message Templates | Per-sender customizable message with variable support |
| Delay (optional) | Time delay before sending (e.g., "immediately", "1 hour", "24 hours") |
| Role-Based Rules | Different welcome messages for different incoming roles |

### Example Configuration

```text
Sender: Sarah Chen (Manager)
Message: "Welcome to the team, [new_member_name]! 👋 My name is Sarah, and I'm your manager here at [location_name]. Feel free to message me anytime with questions - I'm here to help you succeed!"

Sender: Alex Johnson (HR Admin)
Message: "Hey [new_member_name]! Welcome aboard! I'm Alex from HR. If you have any questions about benefits, policies, or just need someone to chat with, don't hesitate to reach out."
```

### Enhancements & Suggestions

1. **Role-Based Routing**: Different roles get different welcome contacts
   - Stylists → Assigned Manager + HR
   - Managers → Admin + Owner
   - Booth Renters → Front Desk + Manager

2. **Location-Aware Messages**: Include location-specific details
   - "Welcome to our [Downtown] location!"
   - Automatically assign welcome sender from same location

3. **Template Variables**:
   - `[new_member_name]` - New hire's display name
   - `[sender_name]` - Sender's first name
   - `[role]` - New member's role
   - `[location_name]` - Assigned location
   - `[start_date]` - If tracked

4. **Preview & Test**: Allow admins to preview how the message will look before enabling

5. **Analytics**: Track engagement (how many new members respond within 24h)

6. **Onboarding Integration**: Tie into the existing onboarding flow - mark "Received welcome messages" as an automatic task completion

## Technical Implementation

### Database Changes

**New table: `team_chat_welcome_rules`**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| sender_user_id | uuid | FK to employee who sends the welcome |
| message_template | text | The welcome message with variables |
| target_roles | text[] | Which roles receive this welcome (null = all) |
| target_locations | text[] | Which locations (null = all) |
| delay_minutes | integer | Delay before sending (default: 0) |
| is_active | boolean | Enable/disable this rule |
| sort_order | integer | Order of messages if multiple senders |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Index:** Unique on (organization_id, sender_user_id) to prevent duplicate senders

### New Settings Tab Component

**File:** `src/components/team-chat/settings/WelcomeDMsTab.tsx`

Features:
- Toggle to enable/disable welcome DMs
- List of configured welcome senders with their messages
- "Add Welcome Sender" dialog with:
  - Searchable user selector (leadership members only)
  - Message template textarea with variable buttons
  - Optional role/location targeting
- Drag-and-drop reordering of senders
- Preview button to see rendered message
- Delete/edit existing rules

### Trigger Logic

**Option A: Edge Function Trigger (Recommended)**
- Database trigger on `employee_profiles` when `is_approved` changes to `true`
- Calls an edge function `send-welcome-dms` that:
  1. Fetches active welcome rules for the org
  2. For each rule, creates/finds DM channel
  3. Inserts the welcome message as if from the sender

**Option B: Frontend Hook**
- Add to `useAutoJoinLocationChannels` or create `useWelcomeDMs`
- Runs when new member first loads Team Chat
- Tracks "has_received_welcome" to prevent duplicates

### Updated `TeamChatAdminSettingsSheet`

Add new tab:
```typescript
<TabsTrigger value="welcome">Welcome</TabsTrigger>

<TabsContent value="welcome" className="mt-0">
  <WelcomeDMsTab settings={settings} onUpdate={updateSettings} />
</TabsContent>
```

### Hook for Managing Welcome Rules

**File:** `src/hooks/team-chat/useWelcomeDMRules.ts`

```typescript
export function useWelcomeDMRules() {
  // CRUD operations for team_chat_welcome_rules
  // - fetchRules()
  // - addRule(sender, message, options)
  // - updateRule(id, updates)
  // - deleteRule(id)
  // - reorderRules(orderedIds)
}
```

### Edge Function for Sending Welcome DMs

**File:** `supabase/functions/send-welcome-dms/index.ts`

Triggered when an employee is approved:
1. Query active welcome rules for the organization
2. For each rule where the new member matches targeting (role/location)
3. Create DM channel between sender and new member
4. Insert welcome message with variables replaced
5. Mark completion in a tracking table

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/team-chat/settings/WelcomeDMsTab.tsx` | Settings UI for welcome DM configuration |
| `src/hooks/team-chat/useWelcomeDMRules.ts` | Hook for managing welcome rules |
| `supabase/functions/send-welcome-dms/index.ts` | Edge function to send automated DMs |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/team-chat/TeamChatAdminSettingsSheet.tsx` | Add "Welcome" tab |
| `src/hooks/team-chat/useTeamChatSettings.ts` | Add `welcome_dms_enabled` setting |
| `src/hooks/team-chat/index.ts` | Export new hooks |

## Database Migration

```sql
-- Welcome DM rules table
CREATE TABLE public.team_chat_welcome_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL,
  message_template TEXT NOT NULL,
  target_roles TEXT[],
  target_locations TEXT[],
  delay_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, sender_user_id)
);

-- Add RLS policies
ALTER TABLE public.team_chat_welcome_rules ENABLE ROW LEVEL SECURITY;

-- Welcome tracking to prevent duplicates
CREATE TABLE public.team_chat_welcome_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  recipient_user_id UUID NOT NULL,
  sender_user_id UUID NOT NULL,
  channel_id UUID NOT NULL,
  message_id UUID,
  sent_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, recipient_user_id, sender_user_id)
);

-- Add welcome_dms_enabled to team_chat_settings
ALTER TABLE public.team_chat_settings 
ADD COLUMN IF NOT EXISTS welcome_dms_enabled BOOLEAN DEFAULT false;
```

## UI Mockup

```text
┌─────────────────────────────────────────────────────────────┐
│  TEAM CHAT SETTINGS                                    [X]  │
├─────────────────────────────────────────────────────────────┤
│  [Channels] [Display] [Perms] [Auto-Join] [Welcome] [AI]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  AUTO WELCOME DMs                                            │
│  ─────────────────                                           │
│  [✓] Enable automatic welcome DMs for new team members       │
│                                                              │
│  WELCOME SENDERS                                             │
│  ─────────────────                                           │
│  When a new member joins, they'll receive DMs from:          │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 📷 Sarah Chen (Manager)                          [Edit] │ │
│  │ "Welcome to the team, [new_member_name]! 👋 My name..."  │ │
│  │ Sends to: All roles                                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 📷 Alex Johnson (HR Admin)                       [Edit] │ │
│  │ "Hey [new_member_name]! Welcome aboard! I'm Alex..."    │ │
│  │ Sends to: Stylists, Assistants                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  [+ Add Welcome Sender]                                      │
│                                                              │
│  ─────────────────                                           │
│  AVAILABLE VARIABLES                                         │
│  [new_member_name] [sender_name] [role] [location_name]      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Expected Result

- Admins can configure welcome DM senders and messages in settings
- When an employee is approved, they automatically receive personalized DMs
- Messages appear as if sent directly by the designated team members
- Creates immediate connection and reduces onboarding friction
- DMs are reusable conversations - both parties can continue chatting

