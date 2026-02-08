
# Message Moderation Enhancements: Pin, Delete, Edit

## Overview

This plan adds three key moderation features to the Team Chat:
1. **Pin messages with threads** - Show thread replies alongside pinned messages
2. **Super Admin-only delete** - Only super admins can delete any message; regular users can only delete their own
3. **5-minute edit window** - Senders can edit their messages within 5 minutes of sending

---

## Current State Analysis

### What's Already Implemented
- **Pinning**: Works via `usePinnedMessages` hook and `chat_pinned_messages` table
- **Editing**: `editMessage` mutation exists in `useChatMessages` but UI button is non-functional
- **Deleting**: Works but allows message owners to delete only (soft delete with `is_deleted` flag)
- **Super Admin check**: Available via `is_super_admin` on `employee_profiles`

### What Needs Enhancement
1. Pinned messages don't show thread context (reply count/previews)
2. Edit button shows but doesn't open an editor
3. Delete is available to all message owners; needs super admin override
4. No time limit on editing

---

## Part 1: Enhanced Pinned Messages with Thread Context

### Changes to `usePinnedMessages.ts`

Add thread reply count and preview to pinned message data:

```typescript
// Fetch reply count for each pinned message
const { data: replyCounts } = await supabase
  .from('chat_messages')
  .select('parent_message_id')
  .in('parent_message_id', messageIds)
  .eq('is_deleted', false);

// Also fetch first 2 replies for preview
const { data: threadPreviews } = await supabase
  .from('chat_messages')
  .select('parent_message_id, content, sender:employee_profiles!chat_messages_sender_employee_fkey(...)')
  .in('parent_message_id', messageIds)
  .order('created_at', { ascending: true })
  .limit(2);
```

### Changes to `PinnedMessagesSheet.tsx`

Display thread info below pinned messages:
- Show "X replies in thread" badge
- Add "View thread" button that opens ThreadPanel
- Show preview of first 1-2 replies

---

## Part 2: Super Admin Delete Permission

### New Hook: `useCanDeleteMessage.ts`

Create a dedicated hook to check delete permissions:

```typescript
export function useCanDeleteMessage(message: MessageWithSender) {
  const { user } = useAuth();
  const { data: profile } = useEmployeeProfile();
  
  // Super admins can delete any message
  if (profile?.is_super_admin) return true;
  
  // Regular users can only delete their own messages
  return message.sender_id === user?.id;
}
```

### Changes to `MessageItem.tsx`

Update the delete menu item to check super admin status:

```typescript
// Props update
interface MessageItemProps {
  // ... existing
  canDelete: boolean; // New prop
}

// In render
{canDelete && (
  <DropdownMenuItem onClick={onDelete} className="text-destructive">
    <Trash2 className="h-4 w-4 mr-2" />
    Delete message
  </DropdownMenuItem>
)}
```

### Changes to `MessageList.tsx`

Pass the `canDelete` prop based on permission check:

```typescript
const isSuperAdmin = userProfile?.is_super_admin;

<MessageItem
  // ...existing props
  canDelete={isSuperAdmin || message.sender_id === user?.id}
/>
```

### Backend Security (RLS Policy Update)

Add RLS check for delete operation:

```sql
-- Update chat_messages RLS for delete (update is_deleted)
CREATE POLICY "Super admins can soft delete any message"
ON public.chat_messages
FOR UPDATE
USING (
  auth.uid() = sender_id  -- Own messages
  OR EXISTS (
    SELECT 1 FROM public.employee_profiles
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);
```

---

## Part 3: 5-Minute Edit Window

### Changes to `MessageItem.tsx`

Add time-based edit check:

```typescript
const canEdit = useMemo(() => {
  if (message.sender_id !== user?.id) return false;
  
  const messageTime = new Date(message.created_at).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  return (now - messageTime) < fiveMinutes;
}, [message.created_at, message.sender_id, user?.id]);
```

### New Component: `MessageEditDialog.tsx`

Create an inline editor or dialog for editing:

```typescript
interface MessageEditDialogProps {
  message: MessageWithSender;
  open: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
}
```

Features:
- Pre-populated textarea with current content
- Character count (optional)
- Save/Cancel buttons
- Shows remaining edit time: "X minutes left to edit"

### Changes to `MessageItem.tsx` Props

Add edit handler:

```typescript
interface MessageItemProps {
  // ... existing
  onEdit?: (content: string) => void;
  canEdit: boolean;
}

// In component
const [isEditing, setIsEditing] = useState(false);

{canEdit && (
  <DropdownMenuItem onClick={() => setIsEditing(true)}>
    <Pencil className="h-4 w-4 mr-2" />
    Edit message
    <span className="ml-auto text-xs text-muted-foreground">
      {getTimeRemaining(message.created_at)}
    </span>
  </DropdownMenuItem>
)}
```

### Helper Function: `getEditTimeRemaining`

```typescript
function getEditTimeRemaining(createdAt: string): string {
  const messageTime = new Date(createdAt).getTime();
  const deadline = messageTime + (5 * 60 * 1000);
  const remaining = deadline - Date.now();
  
  if (remaining <= 0) return 'Expired';
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  return minutes > 0 ? `${minutes}m left` : `${seconds}s left`;
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/team-chat/MessageEditDialog.tsx` | Inline/dialog editor for messages |

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/team-chat/usePinnedMessages.ts` | Add thread reply count and previews |
| `src/components/team-chat/PinnedMessagesSheet.tsx` | Show thread context, add "View thread" action |
| `src/components/team-chat/MessageItem.tsx` | Add `canEdit`, `canDelete` props, edit dialog state, time check |
| `src/components/team-chat/MessageList.tsx` | Compute and pass `canEdit`/`canDelete` props |
| `src/components/team-chat/ThreadMessageItem.tsx` | Same edit/delete enhancements for thread replies |
| `src/hooks/team-chat/useChatMessages.ts` | Add validation for 5-min edit window (optional backend check) |

## Database Changes

Add RLS policy to ensure server-side enforcement:

```sql
-- Allow super admins to soft-delete any message
CREATE POLICY "Users can update own messages or super admins any"
ON public.chat_messages
FOR UPDATE
USING (
  sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.employee_profiles
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);
```

---

## Expected Behavior

| Action | Behavior |
|--------|----------|
| Pin a message with replies | Pinned panel shows "X replies" badge and thread preview |
| Click "View thread" on pinned msg | Opens thread panel for that message |
| Super admin clicks Delete | Deletes any message with confirmation |
| Regular user clicks Delete | Only sees delete option on own messages |
| Click Edit within 5 min | Opens editor with current content |
| Click Edit after 5 min | Edit option hidden or shows "Cannot edit" |
| Save edited message | Updates content, sets `is_edited = true` |

---

## Summary

This enhancement adds:
1. **Rich pinned messages** - Shows thread context so important threads are discoverable
2. **Role-based deletion** - Super admins moderate all content; users self-moderate
3. **Time-limited editing** - 5-minute grace period prevents confusion from heavily edited messages
4. **Consistent UX** - Same patterns in main chat and thread panel
