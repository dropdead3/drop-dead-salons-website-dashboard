
# Fix Messages Not Displaying in Team Chat

## Problem Identified

Messages are being saved correctly to the database but not displaying in the chat UI. 

### Root Cause

The query in `useChatMessages.ts` uses this join syntax:
```typescript
sender:employee_profiles!chat_messages_sender_id_fkey
```

However, the foreign key `chat_messages_sender_id_fkey` references `auth.users(id)`, NOT `employee_profiles`. The Supabase PostgREST API cannot use this foreign key to join to `employee_profiles` because the relationship doesn't exist.

This causes the query to either fail silently or return no data for the sender information.

---

## Solution

Replace the foreign key-based join with a proper relationship query that matches `sender_id` to `employee_profiles.user_id`.

### Database Changes Required

Add a foreign key from `chat_messages.sender_id` to `employee_profiles.user_id`:

```sql
-- Add foreign key to enable PostgREST joins
ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_messages_sender_employee_fkey
FOREIGN KEY (sender_id) REFERENCES public.employee_profiles(user_id)
ON DELETE SET NULL;
```

### Code Changes

Update the join syntax in these files to use the new foreign key:

| File | Change |
|------|--------|
| `src/hooks/team-chat/useChatMessages.ts` | Use `chat_messages_sender_employee_fkey` |
| `src/hooks/team-chat/useThreadMessages.ts` | Use `chat_messages_sender_employee_fkey` |
| `src/hooks/team-chat/usePinnedMessages.ts` | Use `chat_messages_sender_employee_fkey` |
| `src/hooks/team-chat/useMessageSearch.ts` | Use `chat_messages_sender_employee_fkey` |

**Example code change in useChatMessages.ts:**
```typescript
// Before
sender:employee_profiles!chat_messages_sender_id_fkey (

// After  
sender:employee_profiles!chat_messages_sender_employee_fkey (
```

---

## How Messages Display Sender, Date, and Time

Once the fix is applied, each message will display:

| Information | How It's Shown |
|-------------|----------------|
| **Sender Name** | From `sender.display_name` or `sender.full_name` |
| **Avatar** | From `sender.photo_url` |
| **Relative Time** | "5 minutes ago" via `date-fns` |
| **Date Headers** | "Saturday, February 8" grouped by day |
| **Exact Time** | Shown on hover for consecutive messages |

The `MessageItem` component already handles all this display logic - it just needs the data to arrive correctly.

---

## Files to Modify

| File | Change |
|------|--------|
| Database migration | Add FK from sender_id to employee_profiles.user_id |
| `src/hooks/team-chat/useChatMessages.ts` | Update join syntax (line 41) |
| `src/hooks/team-chat/useThreadMessages.ts` | Update join syntax (lines 24, 59) |
| `src/hooks/team-chat/usePinnedMessages.ts` | Update join syntax (line 24) |
| `src/hooks/team-chat/useMessageSearch.ts` | Update join syntax (line 36) |

---

## Expected Result

After the fix:
- Messages will load and display immediately
- Each message shows the sender's name and avatar
- Date separators appear between messages from different days
- Timestamps show relative time ("just now", "5 minutes ago")
- Hovering shows exact timestamps for consecutive messages
