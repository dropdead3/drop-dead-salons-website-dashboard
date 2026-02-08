
# Fix Team Chat Messages Not Displaying

## Problem Summary

Messages are being saved to the database correctly, but they're not appearing in the chat UI. There are **two separate issues** causing this:

### Issue 1: Code Not Yet Loaded by Browser
The network requests show the **old** foreign key constraint name (`chat_messages_sender_id_fkey`) is still being used. The code was updated to use `chat_messages_sender_employee_fkey`, but the browser may be serving cached JavaScript.

### Issue 2: Missing Foreign Key for Channel Members
The `useChannelMembers.ts` hook uses `chat_channel_members_user_id_fkey` to join to `employee_profiles`, but this constraint references `auth.users`, not `employee_profiles`. This causes a 400 error when fetching member profiles.

---

## Solution

### Database Change
Add a new foreign key constraint from `chat_channel_members.user_id` to `employee_profiles.user_id`:

```sql
ALTER TABLE public.chat_channel_members
ADD CONSTRAINT chat_channel_members_employee_fkey
FOREIGN KEY (user_id) REFERENCES public.employee_profiles(user_id)
ON DELETE CASCADE;
```

### Code Change
Update `useChannelMembers.ts` to use the new constraint:

```typescript
// Before
profile:employee_profiles!chat_channel_members_user_id_fkey (

// After
profile:employee_profiles!chat_channel_members_employee_fkey (
```

---

## Files to Modify

| File | Change |
|------|--------|
| Database | Add `chat_channel_members_employee_fkey` constraint |
| `src/hooks/team-chat/useChannelMembers.ts` | Update join hint to use new constraint |

---

## Expected Result

After the fix:
- Messages will load and display with sender name, avatar, and timestamp
- Date separators will appear between messages from different days
- Channel member profiles will load correctly
- The chat will show "Eric Day" as the sender for your test messages
