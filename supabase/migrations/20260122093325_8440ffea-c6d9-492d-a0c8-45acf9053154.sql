-- Add primary owner flag to employee_profiles
ALTER TABLE public.employee_profiles 
ADD COLUMN IF NOT EXISTS is_primary_owner boolean DEFAULT false;

-- Set the current super admin (you) as the primary owner
-- This marks the first super admin as irrevocable
UPDATE public.employee_profiles 
SET is_primary_owner = true 
WHERE is_super_admin = true 
AND user_id = (
  SELECT user_id FROM public.employee_profiles 
  WHERE is_super_admin = true 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Create a function to prevent primary owner demotion
CREATE OR REPLACE FUNCTION public.prevent_primary_owner_demotion()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent removing super_admin from primary owner
  IF OLD.is_primary_owner = true AND NEW.is_super_admin = false THEN
    RAISE EXCEPTION 'Cannot revoke Super Admin status from the Primary Owner';
  END IF;
  
  -- Prevent removing primary_owner flag
  IF OLD.is_primary_owner = true AND NEW.is_primary_owner = false THEN
    RAISE EXCEPTION 'Cannot remove Primary Owner status';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce protection
DROP TRIGGER IF EXISTS protect_primary_owner ON public.employee_profiles;
CREATE TRIGGER protect_primary_owner
  BEFORE UPDATE ON public.employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_primary_owner_demotion();

-- Add comment for documentation
COMMENT ON COLUMN public.employee_profiles.is_primary_owner IS 'Designates the account owner who cannot have Super Admin revoked';