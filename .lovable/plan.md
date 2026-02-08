

# Add Team Member Selection to Create Channel Dialog

## Overview

Add the ability to invite team members directly when creating a new channel, eliminating the need to create the channel first and then add members separately. This is especially useful for private channels where you want to immediately specify who should have access.

## Current State

The `CreateChannelDialog` currently collects:
- Channel name
- Description (optional)
- Privacy toggle (public/private)

After creation, users must navigate to the channel and use the "Add Members" feature in `ChannelMembersSheet` to invite people.

## Proposed Design

### User Experience

1. When "Make private" is toggled ON, show a new "Add members" section
2. Display a searchable list of team members using the existing `useTeamMembers` hook
3. Allow multi-select with visual chips showing selected members
4. Selected members are added to the channel immediately upon creation

```text
+------------------------------------+
| CREATE A CHANNEL                   |
|------------------------------------|
| Name                               |
| # [__________________]             |
|                                    |
| Description (optional)             |
| [______________________]           |
|                                    |
| Make private              [ON]     |
|                                    |
| Add members  (shows when private)  |
| +--------------------------------+ |
| | [x] Sarah Smith                | |
| | [x] John Doe                   | |
| +--------------------------------+ |
| [ Search team members...       ]   |
| > Available Member 1               |
| > Available Member 2               |
|                                    |
|        [Cancel] [Create Channel]   |
+------------------------------------+
```

### Technical Implementation

**1. Update `CreateChannelDialog.tsx`**

Add state for selected members:
```tsx
const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
const [memberSearch, setMemberSearch] = useState('');
const { members: teamMembers, isLoading: loadingMembers } = useTeamMembers(memberSearch);
```

Add member selection UI that appears when `isPrivate` is true:
- Search input for filtering team members
- List of selectable members with avatars
- Chips/badges showing currently selected members
- Remove button on each chip to deselect

**2. Update `useChatChannels.ts` createChannel mutation**

Modify to accept an optional `initialMembers` array:
```tsx
mutationFn: async (data: Omit<ChatChannelInsert, 'organization_id' | 'created_by'> & { 
  initialMembers?: string[] 
}) => {
  // ... create channel
  // ... add creator as owner
  
  // Add initial members
  if (data.initialMembers?.length) {
    const memberships = data.initialMembers.map(userId => ({
      channel_id: channel.id,
      user_id: userId,
      role: 'member' as const,
    }));
    await supabase.from('chat_channel_members').insert(memberships);
  }
}
```

**3. Update submission logic**

Pass selected members when creating the channel:
```tsx
createChannel({
  name: slug,
  description: description.trim() || null,
  type: isPrivate ? 'private' : 'public',
  initialMembers: isPrivate ? selectedMembers : undefined,
}, { onSuccess: ... });
```

## File Changes

| File | Changes |
|------|---------|
| `src/components/team-chat/CreateChannelDialog.tsx` | Add member selection UI with search, chips for selected members, conditional display for private channels |
| `src/hooks/team-chat/useChatChannels.ts` | Extend `createChannel` mutation to accept and add initial members |

## Benefits

1. **Streamlined workflow**: Create channel and add members in one step
2. **Better for private channels**: Especially useful since private channels require explicit membership
3. **Consistent patterns**: Reuses existing `useTeamMembers` hook and avatar components
4. **Optional feature**: Only shown when creating private channels (public channels auto-join all members)

## Edge Cases Handled

- Clear selected members when toggling privacy off
- Reset form state (including selected members) on successful creation
- Exclude current user from selectable list (they're auto-added as owner)
- Handle empty member selection gracefully

