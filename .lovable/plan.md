
# Team Communications App (TeamChat)

## Overview

Build a comprehensive internal team communications platform, similar to Slack, that enables real-time messaging between team members. The app will be accessible as:
1. **Dashboard Page** - Integrated within the existing dashboard at `/dashboard/team-chat`
2. **Standalone PWA** - Installable on mobile and desktop devices
3. **Full-screen mode** - Dedicated layout for focused communication

---

## Core Features

### 1. Channels & Conversations

| Channel Type | Description | Auto-Created |
|--------------|-------------|--------------|
| **#company-wide** | Organization-wide announcements and discussions | Yes |
| **#[location-name]** | Per-location channels (e.g., #west-hollywood, #beverly-hills) | Yes |
| **#managers** | Leadership-only channel | Yes |
| **#general** | Casual conversations | Yes |
| **Direct Messages** | 1:1 private conversations | No |
| **Group DMs** | Multi-person private groups | No |
| **Custom Channels** | User-created topic channels (e.g., #scheduling, #training-tips) | No |

### 2. Messaging Features

- **Real-time messages** using Supabase Realtime
- **Rich text** with markdown support
- **@mentions** for users and roles (@stylists, @managers, @all)
- **Emoji reactions** on messages
- **Thread replies** for organized conversations
- **File attachments** (images, documents)
- **Message search** across channels
- **Typing indicators** using presence
- **Read receipts** (seen by)
- **Message editing and deletion** with audit trail
- **Pin important messages**

### 3. Presence & Status

Leverages existing `usePlatformPresence` hook:
- **Online/Offline indicators**
- **Custom status** (Available, Busy, Do Not Disturb, Away)
- **Status message** ("In a meeting until 3pm")
- **Last seen** timestamp for offline users

### 4. Notifications

Integrates with existing `usePushNotifications`:
- **Desktop/mobile push notifications** for DMs and @mentions
- **Mute channels** individually
- **Do Not Disturb** scheduling
- **Notification preferences** per channel

### 5. Mobile-First Design

- **Responsive layout** with collapsible channel sidebar
- **Touch-optimized** message interactions
- **Swipe gestures** for actions (reply, react)
- **Pull-to-refresh** for latest messages

---

## Architecture

### Database Schema

```text
chat_channels
├── id (uuid)
├── organization_id (uuid, FK)
├── name (text)
├── type (enum: 'public', 'private', 'dm', 'group_dm', 'location')
├── location_id (uuid, nullable, FK to locations)
├── description (text)
├── icon (text)
├── is_archived (boolean)
├── created_by (uuid, FK)
├── created_at / updated_at

chat_channel_members
├── id (uuid)
├── channel_id (uuid, FK)
├── user_id (uuid, FK)
├── role (enum: 'owner', 'admin', 'member')
├── is_muted (boolean)
├── muted_until (timestamptz)
├── last_read_at (timestamptz)
├── joined_at / updated_at

chat_messages
├── id (uuid)
├── channel_id (uuid, FK)
├── sender_id (uuid, FK)
├── content (text)
├── content_html (text) -- rendered markdown
├── parent_message_id (uuid, nullable) -- for threads
├── is_edited (boolean)
├── is_deleted (boolean)
├── deleted_at (timestamptz)
├── metadata (jsonb) -- mentions, links, etc.
├── created_at / updated_at

chat_message_reactions
├── id (uuid)
├── message_id (uuid, FK)
├── user_id (uuid, FK)
├── emoji (text)
├── created_at

chat_attachments
├── id (uuid)
├── message_id (uuid, FK)
├── file_url (text)
├── file_name (text)
├── file_type (text)
├── file_size (integer)
├── created_at

chat_user_status
├── user_id (uuid, PK)
├── status (enum: 'available', 'busy', 'dnd', 'away')
├── status_message (text)
├── status_expires_at (timestamptz)
├── updated_at

chat_pinned_messages
├── id (uuid)
├── channel_id (uuid, FK)
├── message_id (uuid, FK)
├── pinned_by (uuid, FK)
├── pinned_at
```

### Realtime Configuration

Enable realtime for:
- `chat_messages` - New messages, edits, deletions
- `chat_message_reactions` - Reaction updates
- `chat_channel_members` - Membership changes
- `chat_user_status` - Status updates

### Component Structure

```text
src/components/team-chat/
├── index.ts
├── TeamChatContainer.tsx          -- Main container with layout
├── ChannelSidebar.tsx             -- Channel list + DMs
├── ChannelList.tsx                -- Public/private channels
├── DirectMessagesList.tsx         -- DM conversations
├── ChannelHeader.tsx              -- Channel name, members, actions
├── MessageList.tsx                -- Virtualized message list
├── MessageItem.tsx                -- Individual message component
├── MessageInput.tsx               -- Compose with rich text
├── ThreadPanel.tsx                -- Thread replies sidebar
├── MembersList.tsx                -- Channel members panel
├── UserStatusSelector.tsx         -- Status picker dropdown
├── EmojiPicker.tsx                -- Reaction picker
├── MentionAutocomplete.tsx        -- @mention suggestions
├── ChannelSettingsDialog.tsx      -- Channel management
├── CreateChannelDialog.tsx        -- New channel form
├── SearchMessages.tsx             -- Global message search
├── NotificationSettings.tsx       -- Per-channel mute settings

src/hooks/team-chat/
├── useChatChannels.ts             -- Channel CRUD + membership
├── useChatMessages.ts             -- Messages with realtime
├── useChatPresence.ts             -- Enhanced presence for chat
├── useChatNotifications.ts        -- Push notification integration
├── useMessageSearch.ts            -- Full-text search
├── useChatUserStatus.ts           -- Status management
├── useUnreadCounts.ts             -- Unread message counts

src/pages/dashboard/
├── TeamChat.tsx                   -- Dashboard-embedded view
├── TeamChatFullscreen.tsx         -- Standalone full-screen view

src/contexts/
├── TeamChatContext.tsx            -- Active channel, UI state
```

---

## Default Channel Auto-Creation

On organization setup or first chat access:

1. **Query locations** from `locations` table
2. **Create system channels:**
   - `#company-wide` (type: 'public', organization-wide)
   - `#general` (type: 'public')
   - `#managers` (type: 'private', restricted to manager+ roles)
3. **Create location channels:**
   - `#[location-slug]` for each active location (type: 'location')
4. **Auto-add members:**
   - All org members join `#company-wide` and `#general`
   - Location-assigned staff join their location channels
   - Managers/admins join `#managers`

---

## PWA Enhancement

### Current State
The project has a basic service worker (`public/sw.js`) for push notifications but no full PWA manifest.

### Required Changes

1. **Install vite-plugin-pwa**
2. **Add manifest** with proper icons and configuration
3. **Enhanced service worker** for:
   - Offline message queue
   - Background sync
   - Message caching
4. **Install prompt** component
5. **Dedicated `/install` page** for onboarding mobile users

---

## Navigation Integration

Add to Dashboard sidebar under **Main** section:
```typescript
{ 
  href: '/dashboard/team-chat', 
  label: 'Team Chat', 
  icon: MessageSquare, 
  permission: 'view_team_chat' 
}
```

Full-screen route at `/team-chat` for focused messaging.

---

## UI Design

### Desktop Layout (Dashboard Embedded)
```text
┌──────────────────────────────────────────────────────────┐
│  ← Back to Dashboard    #general    ⚡ 12 online    ⚙️   │
├─────────────┬────────────────────────────────────────────┤
│             │                                            │
│  CHANNELS   │  ┌─────────────────────────────────────┐  │
│  #company   │  │ Sarah (10:30am)                     │  │
│  #general ●  │  │ Hey team! Schedule update...       │  │
│  #managers  │  │ 👍 3  ❤️ 2          [Reply] [React] │  │
│  #west-hwd  │  └─────────────────────────────────────┘  │
│  #bev-hills │                                            │
│             │  ┌─────────────────────────────────────┐  │
│  DIRECT     │  │ Mike (10:45am)                      │  │
│  @ Sarah ●   │  │ Got it, I'll adjust...             │  │
│  @ Mike     │  └─────────────────────────────────────┘  │
│  @ Team A   │                                            │
│             │                                            │
│  [+ Channel]│  ┌─────────────────────────────────────┐  │
│             │  │ 💬 Type a message...    📎  😀  ⏎  │  │
│             │  └─────────────────────────────────────┘  │
└─────────────┴────────────────────────────────────────────┘
```

### Mobile Layout
```text
┌───────────────────────────┐
│  ☰   #general   👥  ⚙️   │
├───────────────────────────┤
│                           │
│  ┌─────────────────────┐  │
│  │ Sarah (10:30am)     │  │
│  │ Hey team! Schedule  │  │
│  │ update for today... │  │
│  │ 👍 3  [Swipe: reply]│  │
│  └─────────────────────┘  │
│                           │
│  ┌─────────────────────┐  │
│  │ Mike (10:45am)      │  │
│  │ Got it, thanks!     │  │
│  └─────────────────────┘  │
│                           │
├───────────────────────────┤
│ 💬 Message...   📎 😀 ⏎  │
└───────────────────────────┘
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/dashboard/TeamChat.tsx` | Main chat page in dashboard |
| `src/pages/TeamChatFullscreen.tsx` | Standalone full-screen view |
| `src/components/team-chat/*.tsx` | All chat UI components (15+ files) |
| `src/hooks/team-chat/*.ts` | Chat-specific hooks (7 files) |
| `src/contexts/TeamChatContext.tsx` | Chat state management |
| `supabase/migrations/xxx_chat_schema.sql` | Database schema |
| `public/manifest.json` | PWA manifest |
| `src/pages/Install.tsx` | PWA install prompt page |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add TeamChat routes |
| `src/components/dashboard/DashboardLayout.tsx` | Add Team Chat nav item |
| `vite.config.ts` | Add vite-plugin-pwa |
| `index.html` | Add manifest link and PWA meta tags |
| `public/sw.js` | Enhance for offline chat |

---

## Implementation Phases

### Phase 1: Foundation (Core Infrastructure)
- Database schema and RLS policies
- Basic channel/message CRUD hooks
- TeamChatContainer with channel list
- Message list with realtime
- Basic message input

### Phase 2: Rich Messaging
- Markdown rendering
- @mentions with autocomplete
- Emoji reactions
- File attachments
- Message editing/deletion

### Phase 3: Threads & Organization
- Thread replies panel
- Message pinning
- Channel search
- Message search

### Phase 4: Enhanced UX
- User status system
- Unread counts
- Typing indicators
- Read receipts

### Phase 5: PWA & Mobile
- Full PWA manifest
- Enhanced service worker
- Install prompt
- Offline queue

### Phase 6: Admin Controls
- Channel moderation tools
- Message reporting
- Admin-only channels
- Usage analytics

---

## Security Considerations

### RLS Policies

- **Channels**: Members can view channels they belong to
- **Messages**: Only channel members can read/write messages
- **DMs**: Only participants can access DM channels
- **Admin channels**: Role-based access for #managers

### Data Protection

- Message content encrypted at rest
- Attachment URLs expire after 24 hours
- Deleted messages purged after 30 days
- Audit log for admin actions

---

## Technical Notes

### Leveraging Existing Infrastructure

| Feature | Existing Code |
|---------|---------------|
| Realtime presence | `usePlatformPresence` hook |
| Push notifications | `usePushNotifications` hook |
| User profiles | `employee_profiles` table |
| Locations | `locations` table & `useLocations` hook |
| Organization context | `OrganizationContext` |
| UI components | Existing shadcn/ui library |
| Theme support | Dashboard theme system |

### Performance Optimizations

- **Virtual scrolling** for message lists (react-virtual)
- **Optimistic updates** for sent messages
- **Message batching** for bulk loads
- **Image lazy loading** with blur placeholders
- **Debounced typing indicators**

---

## Result

A full-featured team communications app that:
- Provides real-time messaging across the organization
- Auto-creates location-based channels for easy team coordination
- Works seamlessly on desktop and mobile
- Can be installed as a native-like app via PWA
- Integrates with existing presence and notification systems
- Maintains security with proper RLS and role-based access
