

# AI Smart Actions for Team Chat

## Overview

Build an intelligent AI system that monitors chat messages in real-time and automatically detects actionable requests between team members. When a stylist asks for help (e.g., "Can someone cover my 2pm?" or "I need an assistant for a balayage"), the recipient sees a smart toast notification with a one-click confirm button that directly executes the appropriate action.

## How It Works

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  CHAT MESSAGE FLOW WITH AI ACTION DETECTION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Sarah (Stylist A)                              Mike (Stylist B)            │
│  ┌─────────────────────────┐                   ┌─────────────────────────┐  │
│  │ "Hey Mike, can you take │──── Message ────▶ │   Message appears       │  │
│  │  my 3pm haircut? I'm    │      Sent         │   in chat               │  │
│  │  running behind"        │                   │                         │  │
│  └─────────────────────────┘                   └───────────┬─────────────┘  │
│                                                            │                │
│                     ┌──────────────────────────────────────┘                │
│                     ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  AI DETECTION ENGINE (Edge Function)                                │    │
│  │  ┌─────────────┐ ┌──────────────────┐ ┌───────────────────────────┐ │    │
│  │  │ Parse Msg   │→│ Detect Intent    │→│ Extract Action Details    │ │    │
│  │  │ + Context   │ │ (cover, assist,  │ │ (time, service, client)   │ │    │
│  │  │             │ │  swap, handoff)  │ │                           │ │    │
│  │  └─────────────┘ └──────────────────┘ └──────────────┬────────────┘ │    │
│  └──────────────────────────────────────────────────────┼──────────────┘    │
│                                                         │                   │
│                     ┌───────────────────────────────────┘                   │
│                     ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  SMART ACTION TOAST (appears for Mike)                              │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │ 📋 Sarah asked you to take a client                        │    │    │
│  │  │    Haircut at 3:00 PM                                      │    │    │
│  │  │                                                            │    │    │
│  │  │    [ ✓ Accept ]  [ ✕ Decline ]                             │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│                     │ Click "Accept"                                        │
│                     ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  ACTION EXECUTED                                                    │    │
│  │  • Shift swap created (pending_approval)                            │    │
│  │  • Notification sent to manager (if required)                       │    │
│  │  • Confirmation message posted in chat                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Supported Action Types

| Intent | Example Messages | Action Triggered |
|--------|-----------------|------------------|
| **Client Handoff** | "Can you take my 3pm?", "Can someone cover Jane Doe at 2?" | Creates shift swap or reassigns appointment |
| **Assistant Request** | "I need help with a balayage", "Can you assist me at 4?" | Creates assistant request with auto-assignment |
| **Shift Cover** | "Anyone cover Saturday?", "I can't make it tomorrow" | Opens shift swap flow |
| **Quick Confirmation** | "Are you free at 2?", "Can you stay late?" | Shows availability + confirm action |
| **Product Request** | "Can you grab me some developer?" | Logs informal product request |

## User Experience

1. **Sender types a request** in DM or channel
2. **AI analyzes in real-time** using Lovable AI (gemini-3-flash-preview)
3. **If actionable**: Target user sees a persistent toast with:
   - Clear description of the ask
   - Action details (time, service, client if detected)
   - **Accept** button (executes action immediately)
   - **Decline** button (optional decline message)
   - **View Details** link (opens relevant UI)
4. **On accept**: Action is created, confirmation auto-posted to chat, notifications sent
5. **History tracked**: All smart actions logged for accountability

## Technical Architecture

### New Database Table: `chat_smart_actions`

Stores detected actionable requests and their resolution status:

```sql
CREATE TABLE public.chat_smart_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  channel_id UUID NOT NULL REFERENCES chat_channels(id),
  message_id UUID NOT NULL REFERENCES chat_messages(id),
  sender_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  
  -- AI Detection
  action_type TEXT NOT NULL, -- 'client_handoff', 'assistant_request', 'shift_cover', 'availability_check'
  confidence DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
  detected_intent TEXT NOT NULL,
  extracted_data JSONB DEFAULT '{}', -- { time, date, client_name, service, etc. }
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired', 'dismissed'
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_note TEXT,
  
  -- Linking to actual actions
  linked_action_type TEXT, -- 'shift_swap', 'assistant_request', etc.
  linked_action_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '4 hours')
);
```

### New Edge Function: `detect-chat-action`

Analyzes messages using Lovable AI with tool calling to extract structured action data:

```typescript
// Uses google/gemini-3-flash-preview for fast, accurate intent detection
// Returns structured JSON: { action_type, confidence, target_user, extracted_data }
```

### Frontend Components

| Component | Purpose |
|-----------|---------|
| `SmartActionToast.tsx` | Persistent toast with Accept/Decline buttons |
| `useSmartActions.ts` | Hook to subscribe to pending actions via Supabase Realtime |
| `SmartActionProvider.tsx` | Context that listens for new actions and shows toasts |

### Integration Points

1. **Message Send Hook**: After sending a message, call `detect-chat-action` edge function
2. **Realtime Subscription**: Target user subscribes to `chat_smart_actions` table
3. **Accept Handler**: Calls appropriate mutation (useClaimSwap, useCreateAssistantRequest, etc.)
4. **Chat Auto-Reply**: Posts confirmation message to channel on accept/decline

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/detect-chat-action/index.ts` | AI intent detection edge function |
| `src/hooks/team-chat/useSmartActions.ts` | Fetch and subscribe to smart actions |
| `src/components/team-chat/SmartActionToast.tsx` | Action toast component |
| `src/contexts/SmartActionContext.tsx` | Global provider for action detection |

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/team-chat/useChatMessages.ts` | Call detect-chat-action after sending DMs |
| `src/components/team-chat/TeamChatContainer.tsx` | Wrap with SmartActionProvider |
| `src/pages/dashboard/TeamChat.tsx` | Ensure provider is at correct level |

## Settings Integration

Add to the existing Team Chat Admin Settings:

- **Enable Smart Actions**: On/Off toggle
- **Action Types**: Which action types to detect
- **Confirmation Required**: Whether manager approval is needed for actions
- **Auto-expiry Time**: How long toasts remain active (1hr / 4hr / 8hr)

## Benefits

- **Reduces friction**: One click to handle requests vs. navigating to separate UIs
- **Improves response time**: Actions happen in context of the conversation
- **Creates accountability**: All actions are logged and traceable
- **Slack-inspired UX**: Familiar pattern from workflow automations
- **AI-powered intelligence**: Understands natural language, no special syntax required

