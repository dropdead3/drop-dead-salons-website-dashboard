

# Thread Reply Enhancements

## Current State Analysis

The thread functionality already works:
- Clicking the message bubble icon opens the thread panel
- Users can send replies in the thread
- Replies are shown with reactions

However, the thread input is basic compared to the main chat input and lacks several features.

---

## Proposed Enhancements

### 1. Rich Thread Input (Priority: High)

Replace the plain Textarea in `ThreadPanel.tsx` with the full-featured `MentionInput` component used in the main chat. This adds:

- **Emoji picker** - Same picker as main chat
- **@mentions** - Tag team members in replies
- **Keyboard shortcuts** - Enter to send, Shift+Enter for newline

```text
Current Thread Input:
┌──────────────────────────────────────┐
│ Reply...                        [>]  │
└──────────────────────────────────────┘

Enhanced Thread Input:
┌──────────────────────────────────────┐
│ [😀] [@] Reply in thread...     [>]  │
└──────────────────────────────────────┘
```

### 2. Quote Reply Feature (Priority: High)

Add ability to quote a specific message (parent or reply) when replying:

- Click reply icon on any thread message to quote it
- Shows preview of quoted text above input
- Quote is included in the message when sent

```text
┌──────────────────────────────────────┐
│ ┌─ Replying to Alex Day ──────────┐  │
│ │ "Hey, what time is the meeting?" │  │
│ └────────────────────────── [×] ─┘  │
│                                      │
│ [😀] [@] Your reply...          [>]  │
└──────────────────────────────────────┘
```

### 3. Thread Header Improvements (Priority: Medium)

Show context about the thread:
- Original message preview in header
- Number of participants
- Last activity timestamp

```text
┌─────────────────────────────────────┐
│ 💬 Thread                      [×]  │
│ 3 participants · Last reply 2m ago  │
└─────────────────────────────────────┘
```

### 4. Thread Message Actions (Priority: Medium)

Add more actions to thread messages (currently only reactions):
- Reply/Quote button on each thread message
- Delete own replies
- Edit own replies

### 5. Keyboard Shortcuts (Priority: Low)

- **Escape** - Close thread panel
- **Cmd/Ctrl + Enter** - Send reply (alternative to Enter)

---

## Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `ThreadPanel.tsx` | Replace Textarea with MentionInput + EmojiPicker, add quote state, add keyboard listener |
| `ThreadMessageItem.tsx` | Add reply/quote button, add edit/delete for own messages |
| `useThreadMessages.ts` | Support quoted message reference in replies |
| `TeamChatContext.tsx` | Add quoted message state for threads |

### Database Consideration

For quote replies, we could:
1. **Simple approach**: Prefix quoted text in message content (e.g., `> Original text\n\nReply`)
2. **Structured approach**: Add `quoted_message_id` column to `chat_messages` table

The simple approach is recommended initially as it requires no schema changes and Markdown rendering can style the quote.

### Quote Message Format

```text
> **Alex Day** wrote:
> Hey, what time is the meeting?

It's at 3pm!
```

---

## Expected Behavior

| Action | Result |
|--------|--------|
| Click reply icon on message in main chat | Opens thread panel for that message |
| Click emoji button in thread input | Opens full emoji picker |
| Type @name in thread | Shows mention autocomplete |
| Click reply icon on thread message | Sets that message as quote, shows preview above input |
| Click X on quote preview | Clears the quote |
| Send reply with quote | Message sent with quoted text formatted as blockquote |
| Press Escape in thread panel | Closes the thread |
| Hover on own thread reply | Shows edit/delete options |

---

## Summary

These enhancements bring the thread experience up to par with the main chat:
1. **Rich input** with emoji and mentions
2. **Quote replies** for context in longer threads  
3. **Better navigation** with keyboard shortcuts
4. **Message management** for thread replies

