

# Make Messages Appear Instantly with Optimistic Updates

## Current Problem

The current flow is:
1. User sends message
2. Wait for database insert to complete
3. `onSuccess` invalidates cache
4. React Query refetches all messages from database
5. UI updates

This adds ~200-500ms latency because we wait for two round-trips (insert + refetch).

## Solution: Optimistic Updates

Instead of waiting, we'll immediately add the message to the UI:

1. User sends message
2. **Immediately** add message to local cache (appears in UI)
3. Send to database in background
4. If error, remove the optimistic message and show error

This is the standard pattern for chat applications.

---

## How It Works

React Query's `onMutate` callback runs **before** the API call, allowing us to update the cache optimistically:

```text
User presses Enter
       |
       v
onMutate: Add message to cache immediately (UI updates)
       |
       v
mutationFn: Send to database (runs in background)
       |
       +---> onSuccess: Optionally refetch for sync
       |
       +---> onError: Remove optimistic message, show error
```

---

## Code Changes

Update `src/hooks/team-chat/useChatMessages.ts`:

### 1. Add the user's profile to the hook

We need the current user's profile (name, avatar) to create the optimistic message:

```typescript
// Add import
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';

// Inside the hook
const { data: userProfile } = useEmployeeProfile();
```

### 2. Add `onMutate` for optimistic update

```typescript
const sendMessageMutation = useMutation({
  mutationFn: async ({ content, parentMessageId }) => {
    // ... existing code
  },
  onMutate: async ({ content, parentMessageId }) => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['chat-messages', channelId] });

    // Snapshot previous messages
    const previousMessages = queryClient.getQueryData(['chat-messages', channelId]);

    // Create optimistic message
    const optimisticMessage: MessageWithSender = {
      id: `temp-${Date.now()}`,
      channel_id: channelId!,
      sender_id: user!.id,
      content,
      content_html: null,
      parent_message_id: parentMessageId || null,
      is_edited: false,
      is_deleted: false,
      deleted_at: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: userProfile ? {
        id: userProfile.user_id,
        full_name: userProfile.full_name,
        display_name: userProfile.display_name,
        photo_url: userProfile.photo_url,
      } : undefined,
      reactions: [],
      reply_count: 0,
    };

    // Add to cache immediately
    queryClient.setQueryData(
      ['chat-messages', channelId],
      (old: MessageWithSender[] = []) => [...old, optimisticMessage]
    );

    return { previousMessages };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousMessages) {
      queryClient.setQueryData(['chat-messages', channelId], context.previousMessages);
    }
    toast.error('Failed to send message');
  },
  onSettled: () => {
    // Refetch to sync with server (replaces temp ID with real ID)
    queryClient.invalidateQueries({ queryKey: ['chat-messages', channelId] });
  },
});
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/team-chat/useChatMessages.ts` | Add `useEmployeeProfile` import, add `onMutate` for optimistic updates |

---

## Expected Result

| Before | After |
|--------|-------|
| Send → Wait 300-500ms → See message | Send → See message **instantly** (0ms) |
| Feels sluggish | Feels instant, like Slack |

The message will appear immediately with the user's name and avatar. The background refetch ensures the temporary ID is replaced with the real database ID.

