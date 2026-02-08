
# Instant Thread Replies: Optimistic Updates

## The Problem

Currently, when you send a thread reply:
1. Request goes to server
2. Wait for database insert (~200-500ms)
3. `onSuccess` triggers `invalidateQueries`
4. Another round-trip to fetch updated replies
5. **Finally** the message appears

This creates a noticeable delay of 400-1000ms before your reply shows up.

## The Solution

Add **optimistic updates** to the `sendReplyMutation` in `useThreadMessages.ts` - the same pattern already used successfully in the main chat (`useChatMessages.ts`).

With optimistic updates:
1. Reply appears **instantly** in the UI
2. Server request happens in background
3. On success: replace temp ID with real ID
4. On error: rollback and show error toast

## Implementation

### Changes to `useThreadMessages.ts`

Add `onMutate` callback to `sendReplyMutation`:

```typescript
const sendReplyMutation = useMutation({
  mutationFn: async (content: string) => {
    // ... existing code
  },
  
  // NEW: Optimistic update
  onMutate: async (content: string) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['thread-replies', parentMessageId] });
    
    // Snapshot for rollback
    const previousReplies = queryClient.getQueryData<MessageWithSender[]>(
      ['thread-replies', parentMessageId]
    );
    
    // Create optimistic message
    const optimisticReply: MessageWithSender = {
      id: `temp-${Date.now()}`,
      channel_id: parentMessage?.channel_id!,
      sender_id: user!.id,
      content,
      parent_message_id: parentMessageId,
      created_at: new Date().toISOString(),
      // ... sender info from userProfile
    };
    
    // Add to cache immediately
    queryClient.setQueryData<MessageWithSender[]>(
      ['thread-replies', parentMessageId],
      (old = []) => [...old, optimisticReply]
    );
    
    return { previousReplies };
  },
  
  onError: (error, _content, context) => {
    // Rollback on error
    if (context?.previousReplies) {
      queryClient.setQueryData(
        ['thread-replies', parentMessageId],
        context.previousReplies
      );
    }
    toast.error('Failed to send reply');
  },
  
  onSettled: () => {
    // Sync with server (replaces temp ID)
    queryClient.invalidateQueries({ queryKey: ['thread-replies', parentMessageId] });
  },
});
```

### Dependencies Needed

The hook needs access to `userProfile` to populate the optimistic message's sender info:

```typescript
import { useEmployeeProfile } from '@/hooks/useEmployeeProfile';

export function useThreadMessages(parentMessageId: string | null) {
  const { user } = useAuth();
  const { data: userProfile } = useEmployeeProfile(); // ADD THIS
  // ...
}
```

## Technical Details

| Aspect | Implementation |
|--------|----------------|
| **Temp ID format** | `temp-{timestamp}` for uniqueness |
| **Sender data** | From `userProfile` (display_name, photo_url, etc.) |
| **Rollback** | Restore previous cache on error |
| **Sync** | `invalidateQueries` on settle replaces temp with real |
| **Cancel queries** | Prevents race conditions with in-flight fetches |

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/team-chat/useThreadMessages.ts` | Add `onMutate` optimistic update, import `useEmployeeProfile` |

## Expected Result

| Before | After |
|--------|-------|
| 400-1000ms delay before reply appears | Reply appears **instantly** (<16ms) |
| UI feels sluggish | UI feels responsive like native app |
| Same pattern as main chat | Consistent experience everywhere |

This is a targeted, single-file change that brings thread replies to the same instant-feeling experience as the main chat.
