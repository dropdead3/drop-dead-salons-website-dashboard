

# Channel Deletion for Account Owner (Empty Channels Only)

## Overview

Add the ability for the account owner (primary owner) to **permanently delete** channels that have no message history. If a channel has any messages, it can only be archived (existing behavior). This provides a clean way to remove unused/test channels while protecting channels with valuable conversation history.

## Implementation Approach

### Logic Flow

```text
┌──────────────────────────────────────────┐
│           User clicks delete             │
└───────────────────┬──────────────────────┘
                    │
          ┌─────────▼─────────┐
          │  Is user primary  │
          │     owner?        │
          └─────────┬─────────┘
                    │
         ┌──────────┴──────────┐
         No                   Yes
         │                     │
    ┌────▼────┐       ┌────────▼────────┐
    │ No delete│       │ Check message  │
    │ button   │       │    count       │
    └──────────┘       └────────┬───────┘
                                │
                  ┌─────────────┴─────────────┐
                  │                           │
             count = 0                   count > 0
                  │                           │
          ┌───────▼───────┐           ┌───────▼───────┐
          │ Show DELETE   │           │ Show tooltip: │
          │ button        │           │ "Has history, │
          │               │           │  archive only"│
          └───────┬───────┘           └───────────────┘
                  │
          ┌───────▼───────┐
          │ Confirm dialog│
          │ + delete      │
          └───────────────┘
```

### Technical Implementation

**1. Create a hook to check channel message count**

```typescript
// src/hooks/team-chat/useChannelMessageCount.ts
export function useChannelMessageCount(channelId: string | null) {
  return useQuery({
    queryKey: ['channel-message-count', channelId],
    queryFn: async () => {
      if (!channelId) return 0;
      
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channelId)
        .eq('is_deleted', false);
      
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!channelId,
  });
}
```

**2. Create a hook to check if user is primary owner**

```typescript
// src/hooks/useIsPrimaryOwner.ts
export function useIsPrimaryOwner() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['is-primary-owner', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('is_primary_owner')
        .eq('user_id', user.id)
        .single();
      
      if (error) return false;
      return data?.is_primary_owner ?? false;
    },
    enabled: !!user?.id,
  });
}
```

**3. Update ChannelSettingsSheet.tsx**

Add a delete mutation and conditional UI:

```typescript
// Delete mutation - cascades to members, messages are checked before allowing
const deleteMutation = useMutation({
  mutationFn: async () => {
    if (!activeChannel?.id) throw new Error('No channel');
    
    // First delete channel members
    await supabase
      .from('chat_channel_members')
      .delete()
      .eq('channel_id', activeChannel.id);
    
    // Then delete the channel
    const { error } = await supabase
      .from('chat_channels')
      .delete()
      .eq('id', activeChannel.id);
    
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    setActiveChannel(null);
    toast.success('Channel deleted permanently');
    onOpenChange(false);
  },
  onError: () => {
    toast.error('Failed to delete channel');
  },
});
```

**4. UI Changes in ChannelSettingsSheet**

Add delete button for primary owner when channel is empty:

```tsx
{isPrimaryOwner && !isDM && !activeChannel.is_system && (
  messageCount === 0 ? (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Channel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this channel permanently?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The channel and all its settings will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => deleteMutation.mutate()}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" className="w-full" disabled>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Channel
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        This channel has message history and can only be archived
      </TooltipContent>
    </Tooltip>
  )
)}
```

## File Changes

| File | Changes |
|------|---------|
| `src/hooks/team-chat/useChannelMessageCount.ts` | **New file** - Hook to check if channel has messages |
| `src/hooks/useIsPrimaryOwner.ts` | **New file** - Hook to check if current user is primary owner |
| `src/components/team-chat/ChannelSettingsSheet.tsx` | Add delete mutation, conditional delete UI, toast notifications |

## Toast Notifications

| Action | Toast |
|--------|-------|
| Delete success | `"Channel deleted permanently"` (success) |
| Delete failure | `"Failed to delete channel"` (error) |
| Archive success | `"Channel archived"` (existing - already has toast) |
| Update success | `"Channel updated"` (existing - already has toast) |

## Permissions Summary

| User Type | Empty Channel | Channel with History |
|-----------|---------------|---------------------|
| Primary Owner | Can delete | Can archive only |
| Super Admin | Can archive | Can archive |
| Admin (channel) | Can archive | Can archive |
| Regular Member | No actions | No actions |

## Edge Cases Handled

1. **System channels**: Cannot be deleted (excluded from UI)
2. **DM channels**: Use per-user hide, not delete (different flow)
3. **Race condition**: Message count is checked before showing delete option
4. **Cascade delete**: Channel members are deleted first, then the channel
5. **Loading states**: Disable buttons while mutations are pending

