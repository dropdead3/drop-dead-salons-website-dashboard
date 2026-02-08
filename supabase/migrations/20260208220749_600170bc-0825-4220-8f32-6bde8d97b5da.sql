-- Function to sync renter channel membership based on booth_renter role
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
  -- Determine user_id based on operation
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
    -- Check if user still has booth_renter role (might have multiple entries)
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

-- Trigger on user_roles table for booth_renter role changes
CREATE TRIGGER sync_renter_channel_on_role_change
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_renter_channel_membership();