
# Add Renters Channel with Auto-Join for Booth Renters

## Overview

This feature will create a dedicated "renters" channel for booth renters and automatically add users with the `booth_renter` role to it. Admins and leadership will also have access to communicate with all renters in one place.

## Current Architecture

The system already has:
1. **`booth_renter` role** - Defined in `app_role` enum and `roles` table
2. **Role-based auto-join rules** - `team_chat_role_auto_join` table maps roles to channels
3. **Location channel sync trigger** - `sync_location_channel_memberships()` function handles location-based auto-join
4. **Private channel type** - Supported in `chat_channel_type` enum

## Implementation Approach

### Phase 1: Database Migration

Create a new database trigger function that automatically:
1. **When a user is assigned the `booth_renter` role**: Add them to the "renters" channel
2. **When the role is removed**: Remove them from the "renters" channel

This mirrors the existing `sync_location_channel_memberships` pattern.

```sql
-- Function to sync renter channel membership based on role
CREATE OR REPLACE FUNCTION public.sync_renter_channel_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  renters_channel_id UUID;
  target_user_id UUID;
  target_org_id UUID;
BEGIN
  -- Determine user_id and find their org
  IF TG_OP = 'INSERT' THEN
    target_user_id := NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  END IF;
  
  -- Get org from employee profile
  SELECT organization_id INTO target_org_id
  FROM employee_profiles WHERE user_id = target_user_id;
  
  IF target_org_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Find renters channel in this org
  SELECT id INTO renters_channel_id
  FROM chat_channels
  WHERE organization_id = target_org_id
    AND name = 'renters'
    AND type = 'private'
    AND is_archived = false;
  
  IF renters_channel_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  IF TG_OP = 'INSERT' AND NEW.role = 'booth_renter' THEN
    -- Add to renters channel
    INSERT INTO chat_channel_members (channel_id, user_id, role)
    VALUES (renters_channel_id, NEW.user_id, 'member')
    ON CONFLICT (channel_id, user_id) DO NOTHING;
  ELSIF TG_OP = 'DELETE' AND OLD.role = 'booth_renter' THEN
    -- Check if user still has booth_renter role (might have multiple)
    IF NOT EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = OLD.user_id AND role = 'booth_renter'
    ) THEN
      DELETE FROM chat_channel_members
      WHERE channel_id = renters_channel_id AND user_id = OLD.user_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger on user_roles table
CREATE TRIGGER sync_renter_channel_on_role_change
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  WHEN (NEW.role = 'booth_renter' OR OLD.role = 'booth_renter')
  EXECUTE FUNCTION public.sync_renter_channel_membership();
```

### Phase 2: Channel Initialization Update

Update the `useInitializeDefaultChannels` hook to create a "renters" channel as part of default system channels.

```typescript
// Add to defaultChannels array in useChatChannels.ts
{
  name: 'renters',
  description: 'Private channel for booth renters',
  icon: 'store',
  type: 'private' as const,
}
```

### Phase 3: Auto-Join Admins/Leadership

Update the initialization logic to automatically add leadership roles (super_admin, admin, manager) to the renters channel so they can communicate with renters.

Alternatively, this can be configured via the existing **Auto-Join Rules** tab in Team Chat Settings, giving admins flexibility to control who can access the channel.

## File Changes Summary

| File | Change |
|------|--------|
| **New Migration** | Create `sync_renter_channel_membership()` trigger |
| `src/hooks/team-chat/useChatChannels.ts` | Add "renters" to default system channels |
| `src/components/team-chat/settings/AutoJoinRulesTab.tsx` | Include private channels in joinable list |

## Benefits

1. **Automatic enrollment**: Booth renters are added to the channel as soon as they get the role
2. **Admin visibility**: Leadership can communicate with all renters in one place
3. **Consistent UX**: Follows existing patterns (location channels, role auto-join)
4. **Configurable**: Admins can adjust access via Auto-Join Rules tab
5. **Clean separation**: Renters have their own private space for discussions
