
# Fix DM Channel Display Names

## Problem
When a DM is created, it displays in the sidebar and header as "dm-1770582595901" (a timestamp-based internal name) instead of showing the other person's name like "Alex". The user expects to see the person they're chatting with, not a technical identifier.

## Root Cause
1. DM channels are stored with an internal name like `dm-${Date.now()}` for database purposes
2. The UI components (`ChannelSidebar`, `ChannelHeader`, `MessageList`, `MessageInput`) simply display `channel.name` directly
3. There's no logic to resolve DM channel names to the other participant's display name

## Solution
Fetch DM member information when loading channels, then use a helper function to display the correct name based on channel type.

## Technical Approach

### 1. Extend `useChatChannels` to Include DM Member Info

When fetching DM channels, also fetch the channel members with their profile info so we know who the other person is.

Update the `ChannelWithMembership` interface to include:
```typescript
export interface ChannelWithMembership extends ChatChannel {
  membership?: ChatChannelMember;
  unread_count?: number;
  dm_partner?: {
    user_id: string;
    display_name: string;
    photo_url: string | null;
  };
}
```

### 2. Create a Display Name Utility Hook

**File:** `src/hooks/team-chat/useChannelDisplayName.ts`

A simple hook/utility that:
- For DM channels: returns the other person's name (from `dm_partner`)
- For other channels: returns `channel.name` as-is

```typescript
export function getChannelDisplayName(channel: ChannelWithMembership): string {
  if (channel.type === 'dm' && channel.dm_partner) {
    return channel.dm_partner.display_name;
  }
  return channel.name;
}
```

### 3. Update UI Components

Replace `channel.name` with `getChannelDisplayName(channel)` in:

| Component | Location | Change |
|-----------|----------|--------|
| `ChannelSidebar.tsx` | Line 49 | DM items show partner name |
| `ChannelHeader.tsx` | Line 54 | Header shows partner name |
| `MessageList.tsx` | Line 57 | Welcome message shows partner name |
| `MessageInput.tsx` | Lines 87-88 | Placeholder uses partner name |

### 4. Ensure DM Reuse Works Correctly

The existing `useDMChannels.createDM()` logic already:
- Checks for existing DM channels between both users
- Returns the existing channel if found
- Only creates a new channel if none exists

This means clicking "Alex" twice will reuse the same conversation, not create duplicates.

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/team-chat/useChannelDisplayName.ts` | Helper to get channel display name |

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/team-chat/useChatChannels.ts` | Fetch DM member profiles, add `dm_partner` to channel data |
| `src/hooks/team-chat/index.ts` | Export new hook |
| `src/components/team-chat/ChannelSidebar.tsx` | Use display name helper for DM channels |
| `src/components/team-chat/ChannelHeader.tsx` | Use display name helper |
| `src/components/team-chat/MessageList.tsx` | Use display name helper |
| `src/components/team-chat/MessageInput.tsx` | Use display name helper |

## Expected Result

**Before:**
```
DIRECT MESSAGES
  dm-1770582595901
```

**After:**
```
DIRECT MESSAGES
  Alex Smith
```

The conversation with Alex will:
- Show "Alex Smith" in the sidebar
- Show "Alex Smith" in the header when viewing the DM
- Show "Welcome to Alex Smith" when starting the conversation
- Always open the same conversation (no duplicates)
