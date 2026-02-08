

# AI Agent Chat Integration for Team Chat

## Overview

This feature adds the ability to chat directly with an AI assistant within Team Chat that can **perform real actions** on your behalf - like rescheduling clients, checking availability, or looking up client information. The key differentiator from the existing AI assistant (in the search bar) is that this version will use **tool calling** to actually execute operations with a confirmation flow before making changes.

## Why This is a Great Feature

1. **Natural Language Operations**: "Reschedule Jane's 3pm to tomorrow at 2pm" is faster than navigating menus
2. **Contextual Awareness**: The AI knows who you are, your location, and can access relevant data
3. **Safe by Design**: All destructive actions require explicit confirmation with a visual preview
4. **Integrated Experience**: Works right in the Team Chat where staff already communicate

## Architecture

### User Flow

```text
+------------------+     +--------------------+     +------------------+
| User types       | --> | AI analyzes intent | --> | Tool detected?   |
| "@AI reschedule  |     | with tools         |     |                  |
|  Jane's 3pm..."  |     |                    |     +--------+---------+
+------------------+     +--------------------+              |
                                                    +--------v---------+
                                                    | Yes: Show Action |
                                                    | Preview Card     |
                                                    +--------+---------+
                                                             |
                                              +--------------+--------------+
                                              |                             |
                                     +--------v--------+          +---------v-------+
                                     | User clicks     |          | User clicks     |
                                     | "Confirm"       |          | "Cancel"        |
                                     +--------+--------+          +---------+-------+
                                              |                             |
                                     +--------v--------+          +---------v-------+
                                     | Execute action  |          | Cancel message  |
                                     | Show result     |          | in chat         |
                                     +-----------------+          +-----------------+
```

### Components

1. **AI Channel / DM with AI Bot**
   - Special system channel or DM conversation with "AI Assistant"
   - Messages appear like normal chat but AI responds

2. **AI Agent Edge Function** (`supabase/functions/ai-agent-chat/index.ts`)
   - Enhanced version of existing `ai-assistant` with tool calling
   - Tools for: client lookup, appointment search, rescheduling, availability check

3. **Action Preview Cards** (`src/components/team-chat/AIActionPreview.tsx`)
   - Rich visual cards showing what will happen
   - Confirm/Cancel buttons
   - Shows before/after state for changes

4. **AI Message Renderer** (`src/components/team-chat/AIMessageContent.tsx`)
   - Renders AI responses with markdown
   - Embeds action preview cards inline

---

## Technical Implementation

### Phase 1: AI Chat Channel Setup

**Create AI Bot System User (database)**
- Add a system "AI Assistant" profile that appears as a chat participant
- When user starts a DM with AI, messages route to the edge function instead of storing normally

**Files to modify:**
- `src/contexts/TeamChatContext.tsx` - Add AI channel detection
- `src/components/team-chat/ChannelSidebar.tsx` - Add "AI Assistant" as a special contact
- `src/hooks/team-chat/useChatMessages.ts` - Route AI channel messages to edge function

### Phase 2: Tool-Calling Edge Function

**Create `supabase/functions/ai-agent-chat/index.ts`**

```typescript
// Available tools the AI can call
const TOOLS = [
  {
    name: "search_clients",
    description: "Search for clients by name, phone, or email",
    parameters: { query: { type: "string" } }
  },
  {
    name: "get_client_appointments",
    description: "Get upcoming appointments for a client",
    parameters: { client_id: { type: "string" } }
  },
  {
    name: "check_availability",
    description: "Check stylist availability for a date/time",
    parameters: { 
      staff_id: { type: "string" },
      date: { type: "string" },
      start_time: { type: "string" }
    }
  },
  {
    name: "propose_reschedule",
    description: "Propose rescheduling an appointment (requires confirmation)",
    parameters: {
      appointment_id: { type: "string" },
      new_date: { type: "string" },
      new_time: { type: "string" },
      new_staff_id: { type: "string", optional: true }
    }
  },
  {
    name: "propose_cancel_appointment",
    description: "Propose cancelling an appointment (requires confirmation)",
    parameters: { appointment_id: { type: "string" } }
  }
];
```

**Response Structure for Actions:**
```typescript
interface AIResponse {
  message: string;
  action?: {
    type: 'reschedule' | 'cancel' | 'create_booking';
    status: 'pending_confirmation';
    preview: {
      title: string;
      description: string;
      before?: object; // Current state
      after?: object;  // Proposed state
    };
    params: object; // Parameters to execute if confirmed
  };
}
```

### Phase 3: Action Preview Component

**Create `src/components/team-chat/AIActionPreview.tsx`**

A card that shows:
- Action type badge (Reschedule, Cancel, etc.)
- Current vs. proposed state visually
- Client name, service, time changes
- Confirm (green) / Cancel (red) buttons
- Loading state during execution

Example visual:

```text
┌─────────────────────────────────────────────────┐
│ 📅 Reschedule Appointment                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  Client: Jane Smith                             │
│  Service: Balayage                              │
│                                                 │
│  ❌ Current:  Today, Feb 8 @ 3:00 PM            │
│  ✓  New:      Tomorrow, Feb 9 @ 2:00 PM         │
│                                                 │
│  Stylist: Sarah M. (unchanged)                  │
│                                                 │
├─────────────────────────────────────────────────┤
│  [ Cancel ]                    [ ✓ Confirm ]    │
└─────────────────────────────────────────────────┘
```

### Phase 4: Confirm/Execute Flow

**Create `supabase/functions/execute-ai-action/index.ts`**

When user confirms:
1. Validates the action is still valid (appointment still exists, etc.)
2. Calls existing RPC functions (`reschedule_booking`, `update_booking_status`)
3. Returns result to display success/failure message

**Hook: `src/hooks/team-chat/useAIAgentChat.ts`**
- Manages conversation with AI agent
- Handles action confirmations
- Updates UI with results

### Phase 5: Integration with Message Display

**Modify `src/components/team-chat/MessageItem.tsx`**
- Detect AI agent messages by sender
- Parse message content for action blocks
- Render `AIActionPreview` inline when action is pending

---

## Available Actions (Initial Set)

| Action | Trigger Examples | Confirmation Required |
|--------|-----------------|----------------------|
| **Search Clients** | "Find client Jane Smith" | No |
| **View Appointments** | "What's on Jane's schedule?" | No |
| **Check Availability** | "Is Sarah free tomorrow at 2pm?" | No |
| **Reschedule** | "Move Jane's 3pm to tomorrow 2pm" | Yes |
| **Cancel Appointment** | "Cancel Jane's appointment" | Yes |
| **Check-in Client** | "Check in my 3pm" | Yes |

---

## Database Changes

**Add AI message tracking table:**
```sql
CREATE TABLE ai_agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  channel_id UUID REFERENCES chat_channels(id),
  message_id UUID, -- Reference to chat_messages if stored
  action_type TEXT NOT NULL,
  action_params JSONB NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled, executed, failed
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  executed_at TIMESTAMPTZ
);
```

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `supabase/functions/ai-agent-chat/index.ts` | Tool-calling AI endpoint |
| `supabase/functions/execute-ai-action/index.ts` | Action execution endpoint |
| `src/hooks/team-chat/useAIAgentChat.ts` | Hook for AI chat interactions |
| `src/components/team-chat/AIActionPreview.tsx` | Action confirmation cards |
| `src/components/team-chat/AIMessageContent.tsx` | AI message renderer |
| `src/components/team-chat/StartAIChatButton.tsx` | Button to start AI conversation |

### Modified Files
| File | Changes |
|------|---------|
| `src/contexts/TeamChatContext.tsx` | Add AI channel handling |
| `src/components/team-chat/ChannelSidebar.tsx` | Add AI Assistant entry |
| `src/components/team-chat/MessageItem.tsx` | Detect and render AI messages specially |
| `src/hooks/team-chat/useChatMessages.ts` | Route AI messages to edge function |

---

## Security Considerations

1. **Role-Based Access**: AI can only perform actions the user has permission to do
2. **Audit Trail**: All AI-initiated actions are logged with user confirmation
3. **Confirmation Required**: Destructive operations always need explicit confirmation
4. **Rate Limiting**: Prevent abuse of AI endpoint
5. **Input Validation**: All action parameters validated server-side before execution

---

## Summary

This feature transforms Team Chat into a powerful command center where staff can use natural language to manage their day. The confirmation flow with visual previews ensures safety while the tool-calling architecture makes it extensible for future capabilities (booking creation, product orders, etc.).

