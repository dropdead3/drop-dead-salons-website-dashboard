
# Show Profile Pictures for Direct Messages in Sidebar

## Overview

Update the Team Chat sidebar to display profile pictures (or initials as fallback) for Direct Message channels instead of the generic users icon. This provides a more personal and visually recognizable list of conversations.

## Current State

The `ChannelItem` component currently shows a static icon for all channel types:
- Public channels: Hash icon
- Private channels: Lock icon  
- Location channels: MapPin icon
- **DM channels: Users icon** (same for all DMs)

The data infrastructure already exists - `dm_partner.photo_url` is fetched in `useChatChannels` and `getChannelAvatarUrl()` helper is available but unused.

## Proposed Design

For DM channels, replace the icon with an Avatar component:
- **With photo**: Display the partner's profile picture
- **Without photo**: Show initials derived from their display name (e.g., "Alex Day" becomes "AD")

```text
Before:                          After:
┌─────────────────────┐          ┌─────────────────────┐
│ 👥 Alex Day         │          │ [📷] Alex Day       │  (photo)
│ 👥 Sarah Smith      │    →     │ [SS] Sarah Smith    │  (initials)
│ 👥 John Doe         │          │ [📷] John Doe       │  (photo)
└─────────────────────┘          └─────────────────────┘
```

## Technical Implementation

**Update `ChannelItem` in `ChannelSidebar.tsx`:**

1. Import the Avatar component
2. Check if channel is a DM type
3. For DMs: render Avatar with photo or initials
4. For other channels: keep the existing icon behavior

```tsx
// Helper to extract initials
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// In ChannelItem component
const isDM = channel.type === 'dm' || channel.type === 'group_dm';
const avatarUrl = getChannelAvatarUrl(channel);
const displayName = getChannelDisplayName(channel);

// Render
{isDM ? (
  <Avatar className="h-5 w-5 shrink-0">
    <AvatarImage src={avatarUrl || undefined} alt={displayName} />
    <AvatarFallback className="text-[10px]">
      {getInitials(displayName)}
    </AvatarFallback>
  </Avatar>
) : (
  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
)}
```

## File Changes

| File | Changes |
|------|---------|
| `src/components/team-chat/ChannelSidebar.tsx` | Import Avatar components, add initials helper, update ChannelItem to conditionally render Avatar for DMs |

## Benefits

1. **Visual recognition**: Quickly identify conversations by profile picture
2. **Consistent UX**: Matches how modern chat apps display DMs (Slack, Discord, etc.)
3. **Graceful fallback**: Initials ensure every DM has a meaningful visual identifier
4. **Minimal changes**: Leverages existing data and helper functions
