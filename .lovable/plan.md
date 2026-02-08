

# Team Chat Enhancement Roadmap

Based on analyzing the current implementation, here are the most impactful features to add next, prioritized by user value and building on existing infrastructure.

---

## Priority 1: Thread Replies Panel

**Why First**: The context already has `openThread()`/`closeThread()` methods and messages track `parent_message_id` + `reply_count`. Just missing the UI.

| Component | Purpose |
|-----------|---------|
| `ThreadPanel.tsx` | Slide-out panel showing parent message + replies |
| Update `TeamChatContainer` | Render thread panel when `threadMessageId` is set |
| Update `useChatMessages` | Add `useThreadMessages()` hook for fetching replies |

**User Experience**:
- Click "X replies" on any message to open thread panel on the right
- Panel shows original message at top, replies below
- Dedicated input to reply in thread
- Close button to collapse panel

---

## Priority 2: File Attachments

**Why Second**: The `chat_attachments` table already exists. Just need upload UI and display.

| Component | Purpose |
|-----------|---------|
| Storage bucket | Create `chat-attachments` bucket |
| `AttachmentUpload.tsx` | Drag-drop or click to upload files |
| Update `MessageInput` | Wire up the existing Paperclip button |
| Update `MessageItem` | Display attached images/files |

**Supported Types**:
- Images (inline preview)
- Documents (download link with icon)
- Limit: 10MB per file

---

## Priority 3: Direct Messages (DMs)

**Why Third**: The `dm` and `group_dm` channel types already exist in the schema.

| Component | Purpose |
|-----------|---------|
| `StartDMDialog.tsx` | Search and select team members |
| Update `ChannelSidebar` | Wire up the + button in DMs section |
| `useDMChannels` hook | Create/fetch DM channels between users |

**Behavior**:
- Click + in Direct Messages section
- Search for team member by name
- Creates a private channel with just those two users
- Channel name shows other person's name (not "dm-uuid")

---

## Priority 4: Unread Message Indicators

**Why Fourth**: High user value for knowing where to focus attention.

| Component | Purpose |
|-----------|---------|
| Update `useChatChannels` | Compare `last_read_at` with latest message timestamp |
| Update `ChannelItem` | Show unread count badge |
| Update `ChannelSidebar` | Bold unread channels |

**Behavior**:
- Unread count badge appears on channels with new messages
- Opening a channel marks messages as read
- Bold channel name until read

---

## Priority 5: @Mentions with Autocomplete

**Why Fifth**: Common chat pattern that increases engagement.

| Component | Purpose |
|-----------|---------|
| `MentionAutocomplete.tsx` | Dropdown showing matching team members |
| Update `MessageInput` | Detect `@` trigger and show autocomplete |
| Update `MessageItem` | Highlight mentions in message content |
| Notification system | Notify users when mentioned |

---

## Priority 6: Pinned Messages

**Why Sixth**: The `chat_pinned_messages` table exists but isn't used.

| Component | Purpose |
|-----------|---------|
| `PinnedMessagesPanel.tsx` | List of pinned messages for channel |
| Update `MessageItem` dropdown | Add "Pin message" option |
| Update `ChannelHeader` | Pin icon showing pinned count |

---

## Priority 7: User Status & Availability

**Why Seventh**: The `chat_user_status` table exists with status types.

| Component | Purpose |
|-----------|---------|
| `UserStatusPicker.tsx` | Set status (online, away, busy, offline) |
| Update avatars | Show status dot indicator |
| Custom status message | "In a meeting", "On vacation", etc. |

---

## Priority 8: Message Search

**Full-text search across all messages in channels you have access to.**

| Component | Purpose |
|-----------|---------|
| `SearchDialog.tsx` | Global search modal (Cmd+K) |
| Search results | Show message previews with context |
| Jump to message | Navigate to specific message in channel |

---

## Priority 9: Channel Settings & Members Panel

**Why Last**: Less frequently used but needed for complete feature set.

| Component | Purpose |
|-----------|---------|
| `ChannelSettingsSheet.tsx` | Edit name, description, archive |
| `ChannelMembersSheet.tsx` | View/manage channel members |
| Wire up Settings/Users buttons | Currently non-functional in header |

---

## Recommended Starting Point

I recommend building **Thread Replies Panel** first because:
1. Context already has the methods (`openThread`, `closeThread`, `threadMessageId`)
2. Messages already track `parent_message_id` and display `reply_count`
3. High user value - threaded conversations are essential for organized discussions
4. Foundation for more complex features like notifications

Would you like me to implement the Thread Replies Panel, or would you prefer a different enhancement?

