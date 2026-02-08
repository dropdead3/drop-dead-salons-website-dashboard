
# Auto-Join Users to Default & Location Channels

## Overview

Enhance the Team Chat initialization to automatically grant users access to:
1. **Organization-wide channels** (`#company-wide`, `#general`) - All org members automatically join
2. **Location channels** (`#[location-name]`) - Users auto-join based on their assigned locations

---

## Current Issues

| Problem | Impact |
|---------|--------|
| Only channel creator is auto-joined | Other org members see channels but must manually join |
| Location assignment not checked | Users assigned to locations don't automatically get access to those channels |
| No sync when location changes | User's location-based memberships don't update when profile changes |

---

## Solution Components

### 1. Hook for User Location-Based Channel Sync

Create a new hook `useAutoJoinChannels` that:
- Runs when Team Chat loads
- Checks user's assigned locations (`location_id` / `location_ids`)
- Automatically joins them to:
  - All public system channels (`company-wide`, `general`)
  - Location channels matching their assignments

### 2. Enhanced Channel Initialization

Update `useInitializeDefaultChannels` to:
- After creating channels, fetch ALL org members
- Auto-join everyone to public system channels
- Auto-join users to location channels based on their profile

### 3. RLS Policy Adjustment

The current RLS allows members to view channels they belong to. We need to ensure:
- Users can INSERT their own membership for public/location channels they should access

---

## Implementation

### New Hook: `useAutoJoinLocationChannels.ts`

```typescript
// Automatically joins the current user to channels they should have access to
export function useAutoJoinLocationChannels() {
  const { user } = useAuth();
  const { effectiveOrganization } = useOrganizationContext();
  const { data: profile } = useEmployeeProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // 1. Get user's assigned location IDs
      const locationIds = profile?.location_ids?.length 
        ? profile.location_ids 
        : (profile?.location_id ? [profile.location_id] : []);

      // 2. Get all public + location channels for the org
      const { data: channels } = await supabase
        .from('chat_channels')
        .select('*')
        .eq('organization_id', effectiveOrganization.id)
        .eq('is_archived', false)
        .in('type', ['public', 'location']);

      // 3. Get user's current memberships
      const { data: existingMemberships } = await supabase
        .from('chat_channel_members')
        .select('channel_id')
        .eq('user_id', user.id);

      const memberChannelIds = new Set(existingMemberships?.map(m => m.channel_id));

      // 4. Determine which channels to join
      const channelsToJoin = channels?.filter(channel => {
        // Skip if already a member
        if (memberChannelIds.has(channel.id)) return false;
        
        // Join all public system channels
        if (channel.type === 'public') return true;
        
        // Join location channels matching user's assignments
        if (channel.type === 'location' && channel.location_id) {
          return locationIds.includes(channel.location_id);
        }
        
        return false;
      }) || [];

      // 5. Batch insert memberships
      if (channelsToJoin.length > 0) {
        await supabase
          .from('chat_channel_members')
          .insert(channelsToJoin.map(ch => ({
            channel_id: ch.id,
            user_id: user.id,
            role: 'member',
          })));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    },
  });
}
```

### Update ChannelSidebar.tsx

Add the auto-join call after initialization:

```typescript
const autoJoinChannels = useAutoJoinLocationChannels();

useEffect(() => {
  if (!isLoading && channels.length > 0) {
    // Auto-join user to appropriate channels based on profile
    autoJoinChannels.mutate();
  }
}, [isLoading, channels.length]);
```

### Enhance useInitializeDefaultChannels

After creating channels, auto-join all org members:

```typescript
// After creating channels, auto-join all org members to public channels
const { data: orgMembers } = await supabase
  .from('employee_profiles')
  .select('user_id, location_id, location_ids')
  .eq('organization_id', effectiveOrganization.id)
  .eq('is_active', true)
  .eq('is_approved', true);

// For each public channel, add all org members
for (const channel of createdPublicChannels) {
  const memberships = orgMembers?.map(member => ({
    channel_id: channel.id,
    user_id: member.user_id,
    role: 'member',
  })) || [];
  
  await supabase
    .from('chat_channel_members')
    .upsert(memberships, { onConflict: 'channel_id,user_id' });
}

// For each location channel, add members assigned to that location
for (const locChannel of createdLocationChannels) {
  const locationMembers = orgMembers?.filter(m => {
    const memberLocations = m.location_ids?.length 
      ? m.location_ids 
      : (m.location_id ? [m.location_id] : []);
    return memberLocations.includes(locChannel.location_id);
  }) || [];
  
  const memberships = locationMembers.map(member => ({
    channel_id: locChannel.id,
    user_id: member.user_id,
    role: 'member',
  }));
  
  if (memberships.length > 0) {
    await supabase
      .from('chat_channel_members')
      .upsert(memberships, { onConflict: 'channel_id,user_id' });
  }
}
```

---

## Database Changes

Add a unique constraint if not already present to allow upsert:

```sql
-- Add unique constraint for upsert support
ALTER TABLE public.chat_channel_members
ADD CONSTRAINT chat_channel_members_channel_user_unique 
UNIQUE (channel_id, user_id);
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/team-chat/useAutoJoinLocationChannels.ts` | Auto-join user to appropriate channels |

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/team-chat/useChatChannels.ts` | Enhance initialization to auto-add all org members |
| `src/components/team-chat/ChannelSidebar.tsx` | Call auto-join hook on load |
| `src/hooks/team-chat/index.ts` | Export new hook |

---

## Behavior After Implementation

| Scenario | Result |
|----------|--------|
| New organization first opens Team Chat | All org members auto-joined to `#company-wide`, `#general`, and their location channels |
| Existing user opens Team Chat | Automatically joined to any channels they should have access to but aren't members of yet |
| User's location assignment changes | Next time they open Team Chat, they're joined to new location channels |
| New employee joins organization | On first Team Chat access, auto-joined to appropriate channels |

---

## Result

Users will automatically be members of:
- `#company-wide` and `#general` channels (all org members)
- `#[location-name]` channels matching their assigned locations

No manual joining required - the system handles membership based on organizational structure and location assignments.
