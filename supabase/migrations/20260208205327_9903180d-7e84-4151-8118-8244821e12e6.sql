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