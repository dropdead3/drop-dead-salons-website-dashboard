
# Automatic Location Channel Assignment on Profile Update

## Overview

When a team member updates their assigned locations (via their own profile or through admin editing), they should automatically be added to the corresponding location-specific chat channels. This ensures chat access stays in sync with location assignments.

---

## Current State

1. **`useAutoJoinLocationChannels` hook** - Already exists and runs when a user first opens Team Chat
   - Only runs once per session (uses `hasRun` ref)
   - Joins user to public channels and location channels matching their profile

2. **Profile update flow** - Uses `useUpdateEmployeeProfile` hook
   - Updates `location_id` and `location_ids` fields
   - Does NOT trigger any chat channel sync

**Problem**: If an admin assigns a user to "Val Vista Lakes" location, that user won't see the Val Vista Lakes chat channel until they refresh or re-enter Team Chat.

---

## Proposed Solution

Create a **database trigger** that automatically syncs chat channel memberships whenever `employee_profiles.location_ids` changes. This is the most reliable approach because:

1. Works regardless of which UI/API updates the profile
2. Runs server-side, so it works even if the user isn't logged in
3. Can handle both adding AND removing locations

---

## Implementation Details

### Database Trigger Function

Create a PostgreSQL function that:
1. Detects changes to `location_id` or `location_ids` columns
2. Finds location-type channels matching the new/removed locations
3. Adds/removes the user from those channels

```text
When employee_profiles UPDATE:
  ┌─────────────────────────────────────────────────────────────┐
  │ Compare OLD.location_ids vs NEW.location_ids                │
  │                                                             │
  │ NEW locations not in OLD → Add to matching location channels│
  │ OLD locations not in NEW → Remove from matching channels    │
  └─────────────────────────────────────────────────────────────┘
```

### SQL Migration

```sql
-- Function to sync chat channel memberships based on location assignments
CREATE OR REPLACE FUNCTION public.sync_location_channel_memberships()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_locations TEXT[];
  new_locations TEXT[];
  added_locations TEXT[];
  removed_locations TEXT[];
  org_id UUID;
BEGIN
  -- Get organization_id
  org_id := COALESCE(NEW.organization_id, OLD.organization_id);
  
  -- Build location arrays (handle both location_id and location_ids)
  old_locations := COALESCE(OLD.location_ids, ARRAY[]::TEXT[]);
  IF OLD.location_id IS NOT NULL AND NOT (OLD.location_id = ANY(old_locations)) THEN
    old_locations := array_append(old_locations, OLD.location_id);
  END IF;
  
  new_locations := COALESCE(NEW.location_ids, ARRAY[]::TEXT[]);
  IF NEW.location_id IS NOT NULL AND NOT (NEW.location_id = ANY(new_locations)) THEN
    new_locations := array_append(new_locations, NEW.location_id);
  END IF;
  
  -- Find added locations
  added_locations := ARRAY(
    SELECT unnest(new_locations)
    EXCEPT
    SELECT unnest(old_locations)
  );
  
  -- Find removed locations
  removed_locations := ARRAY(
    SELECT unnest(old_locations)
    EXCEPT
    SELECT unnest(new_locations)
  );
  
  -- Add user to location channels for newly added locations
  IF array_length(added_locations, 1) > 0 THEN
    INSERT INTO public.chat_channel_members (channel_id, user_id, role)
    SELECT c.id, NEW.user_id, 'member'
    FROM public.chat_channels c
    WHERE c.organization_id = org_id
      AND c.type = 'location'
      AND c.location_id = ANY(added_locations)
      AND c.is_archived = false
    ON CONFLICT (channel_id, user_id) DO NOTHING;
  END IF;
  
  -- Remove user from location channels for removed locations
  IF array_length(removed_locations, 1) > 0 THEN
    DELETE FROM public.chat_channel_members
    WHERE user_id = NEW.user_id
      AND channel_id IN (
        SELECT c.id FROM public.chat_channels c
        WHERE c.organization_id = org_id
          AND c.type = 'location'
          AND c.location_id = ANY(removed_locations)
      );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on employee_profiles
DROP TRIGGER IF EXISTS sync_location_channels_on_profile_update ON public.employee_profiles;
CREATE TRIGGER sync_location_channels_on_profile_update
  AFTER UPDATE OF location_id, location_ids ON public.employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_location_channel_memberships();
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/[new].sql` | Add trigger function and trigger |

---

## Behavior Matrix

| Action | Result |
|--------|--------|
| Admin assigns user to "Val Vista Lakes" | User auto-joined to val-vista-lakes channel |
| User adds "North Mesa" to their locations | User auto-joined to north-mesa channel |
| Admin removes "Val Vista Lakes" from user | User removed from val-vista-lakes channel |
| User updates unrelated profile fields | No channel changes |
| New location channel created | Existing users NOT auto-added (future enhancement) |

---

## Edge Cases Handled

1. **Duplicate memberships** - Uses `ON CONFLICT DO NOTHING`
2. **Archived channels** - Only syncs to non-archived channels
3. **Both location_id and location_ids** - Handles legacy and new fields
4. **Cross-organization** - Scoped by organization_id

---

## Summary

This database trigger approach ensures location-based chat channel access is always synchronized with the user's profile assignments, regardless of how the profile is updated (self-edit, admin edit, API, etc.).
