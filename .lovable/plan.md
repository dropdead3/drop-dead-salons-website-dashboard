

# Fix Messages Not Displaying After Sending

## Problem Identified

Messages are being saved to the database correctly (confirmed: "Test 3" appears multiple times in the database), but the UI doesn't update immediately after pressing Enter.

### Root Cause

The `sendMessageMutation` in `useChatMessages.ts` does NOT invalidate the React Query cache on success. It relies entirely on the Supabase Realtime subscription to trigger a refetch. If realtime has latency or connection issues, the UI won't update.

```typescript
// Current code - NO cache invalidation
onSuccess: () => {
  // Only updates last_read_at, doesn't refresh messages
  if (user?.id && channelId) {
    supabase.from('chat_channel_members').update({ last_read_at: ... })
  }
}
```

---

## Solution

Add explicit cache invalidation in the mutation's `onSuccess` callback to ensure immediate UI updates, while keeping realtime as a backup for messages from other users.

### Code Change

Update `src/hooks/team-chat/useChatMessages.ts`:

```typescript
const sendMessageMutation = useMutation({
  mutationFn: async ({ content, parentMessageId }: { content: string; parentMessageId?: string }) => {
    // ... existing code
  },
  onSuccess: () => {
    // CRITICAL: Invalidate cache immediately to show the new message
    queryClient.invalidateQueries({ queryKey: ['chat-messages', channelId] });
    
    // Update last_read_at for the user in this channel
    if (user?.id && channelId) {
      supabase
        .from('chat_channel_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('channel_id', channelId)
        .eq('user_id', user.id)
        .then(() => {});
    }
  },
  onError: (error) => {
    console.error('Failed to send message:', error);
    toast.error('Failed to send message');
  },
});
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/team-chat/useChatMessages.ts` | Add `queryClient.invalidateQueries` in `onSuccess` (line ~170) |

---

## How It Works

| Before | After |
|--------|-------|
| Send message → Wait for realtime → Maybe update | Send message → Immediately invalidate cache → Refetch → Update |
| UI update depends on realtime working | UI update guaranteed via cache invalidation |
| Realtime as only mechanism | Realtime as backup for other users' messages |

---

## Expected Result

After the fix:
- When you press Enter, the message appears immediately
- No need to refresh the page
- Realtime still works for messages from other users
- The message will show your name "Eric Day", avatar, and timestamp

