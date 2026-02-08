

# DM Archive & Role-Based Sorting

## Overview

Two enhancements to the Direct Messages section:

1. **Archive DMs**: Allow users to hide conversations from their sidebar while keeping them searchable. If either party messages again, the DM reappears automatically.

2. **Role Hierarchy Sorting**: Organize DMs by the other person's role level (Super Admin > Admin > Manager > etc.)

---

## Part 1: Archive DMs

### Current State
- The `is_archived` field exists on `chat_channels` but is channel-level (affects all members)
- DMs are 1:1 private conversations between two users
- No per-user archive mechanism exists

### Proposed Approach

Since DM archiving should be **per-user** (you archive it but your partner still sees it), we'll use the existing `chat_channel_members` table to add a user-specific archive flag.

**Database Change:**
```sql
ALTER TABLE public.chat_channel_members
ADD COLUMN is_hidden BOOLEAN DEFAULT false;
```

### UI Flow

```text
┌───────────────────────────────────────────────────────────────┐
│ ⚙  CONVERSATION SETTINGS                                     │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ 💬  DM with Alex Day                                    │   │
│ │     Direct Message                                      │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ 🗄  Archive Conversation                                │   │
│ │ Hide from sidebar. Reappears when either of you        │   │
│ │ sends a new message.                                   │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Auto-Unarchive Behavior

When a new message is sent:
1. Database trigger OR application logic checks if either member has `is_hidden = true`
2. Sets `is_hidden = false` for both members
3. DM reappears in both users' sidebars

### Searchable When Archived

- Update `useChatChannels` to filter out DMs where `is_hidden = true` from the sidebar
- Update message search to include ALL DMs (including hidden ones)
- When searching and selecting an archived DM, it automatically unarchives

---

## Part 2: DM Role Hierarchy Sorting

### Role Priority Order (from `useUserRoles.ts`)

```text
Level 1: super_admin    → Primary leadership
Level 2: admin          → Secondary leadership
Level 3: manager        → Management
Level 4: stylist, stylist_assistant, receptionist, etc.
Level 5: (no role)      → Lowest priority
```

### Implementation

Update `ChannelSidebar.tsx` to sort `dmChannels` by partner's role priority:

```typescript
const ROLE_PRIORITY: Record<string, number> = {
  super_admin: 1,
  admin: 2,
  manager: 3,
  stylist: 4,
  receptionist: 5,
  stylist_assistant: 6,
  admin_assistant: 7,
  operations_assistant: 8,
  booth_renter: 9,
  bookkeeper: 10,
  assistant: 11, // Legacy
};

// Sorting logic
dmChannels.sort((a, b) => {
  const roleA = a.dm_partner?.role || 99;
  const roleB = b.dm_partner?.role || 99;
  const priorityA = ROLE_PRIORITY[roleA] ?? 99;
  const priorityB = ROLE_PRIORITY[roleB] ?? 99;
  
  if (priorityA !== priorityB) return priorityA - priorityB;
  // Secondary sort: alphabetical by name
  return a.dm_partner?.display_name?.localeCompare(b.dm_partner?.display_name) || 0;
});
```

### Data Requirement

Need to include the DM partner's **role** in the channel query. Update `useChatChannels.ts` to also fetch roles:

```typescript
// When fetching DM members, also get their role
const { data: dmMembers } = await supabase
  .from('chat_channel_members')
  .select(`
    channel_id,
    user_id,
    employee_profiles!chat_channel_members_employee_fkey (
      display_name,
      full_name,
      photo_url,
      user_id
    )
  `)
  .in('channel_id', dmChannelIds)
  .neq('user_id', user.id);

// Then fetch roles for these users
const { data: userRoles } = await supabase
  .from('user_roles')
  .select('user_id, role')
  .in('user_id', dmMembers.map(m => m.user_id));
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/` | Add `is_hidden` column to `chat_channel_members` |
| `src/hooks/team-chat/useChatChannels.ts` | Filter hidden DMs from sidebar; include partner role in dm_partner object |
| `src/components/team-chat/ChannelSidebar.tsx` | Sort DM channels by role hierarchy |
| `src/components/team-chat/ChannelSettingsSheet.tsx` | Add Archive Conversation button for DMs |
| `src/hooks/team-chat/useDMChannels.ts` | Unarchive DM when starting conversation with existing partner |
| `src/hooks/team-chat/useMessageSearch.ts` | Ensure archived DMs are still searchable |

---

## Expected Behavior

| Action | Result |
|--------|--------|
| Click "Archive Conversation" on DM | DM hidden from your sidebar only |
| Search for message in archived DM | Message found, clicking it unarchives the DM |
| Partner sends you a message | DM automatically reappears in your sidebar |
| You start a new DM with same person | Existing DM is found and unarchived |
| View DM list | Sorted by role: Super Admin first, then Admin, Manager, etc. |

---

## Summary

These changes make DM management more user-friendly:
- **Archive**: Declutter your sidebar without losing conversation history
- **Auto-unarchive**: Never miss messages because you archived someone
- **Role sorting**: Quickly find conversations with leadership

