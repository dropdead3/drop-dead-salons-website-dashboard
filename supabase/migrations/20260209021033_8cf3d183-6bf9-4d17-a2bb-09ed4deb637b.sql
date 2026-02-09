-- Add login_pin column to employee_profiles
ALTER TABLE public.employee_profiles
ADD COLUMN IF NOT EXISTS login_pin TEXT DEFAULT NULL;

-- Create PIN changelog table for audit trail
CREATE TABLE public.employee_pin_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_profile_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT
);

-- Create indexes for performance
CREATE INDEX idx_employee_pin_changelog_profile ON public.employee_pin_changelog(employee_profile_id);
CREATE INDEX idx_employee_pin_changelog_date ON public.employee_pin_changelog(changed_at DESC);

-- Enable RLS on changelog table
ALTER TABLE public.employee_pin_changelog ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view own PIN changelog, primary owner and super admins can view all
CREATE POLICY "Users can view own PIN changelog, admins can view all"
ON public.employee_pin_changelog FOR SELECT
TO authenticated
USING (
  employee_profile_id IN (
    SELECT id FROM public.employee_profiles WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.employee_profiles 
    WHERE user_id = auth.uid() 
    AND (is_primary_owner = true OR is_super_admin = true)
  )
);

-- RLS Policy: Users can log own PIN changes, admins can log any (except primary owner's)
CREATE POLICY "Users can log own PIN changes, admins can log any"
ON public.employee_pin_changelog FOR INSERT
TO authenticated
WITH CHECK (
  changed_by = auth.uid()
  AND (
    -- User logging their own PIN change
    employee_profile_id IN (
      SELECT id FROM public.employee_profiles WHERE user_id = auth.uid()
    )
    -- OR admin logging someone else's (but not primary owner's)
    OR (
      EXISTS (
        SELECT 1 FROM public.employee_profiles 
        WHERE user_id = auth.uid() 
        AND (is_primary_owner = true OR is_super_admin = true)
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.employee_profiles 
        WHERE id = employee_profile_id 
        AND is_primary_owner = true
        AND user_id != auth.uid()
      )
    )
  )
);

-- Helper function to validate a PIN and return matching user info
CREATE OR REPLACE FUNCTION public.validate_user_pin(_organization_id uuid, _pin text)
RETURNS TABLE(user_id uuid, display_name text, photo_url text, is_super_admin boolean, is_primary_owner boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ep.user_id,
    COALESCE(ep.display_name, ep.full_name) as display_name,
    ep.photo_url,
    ep.is_super_admin,
    ep.is_primary_owner
  FROM public.employee_profiles ep
  WHERE ep.organization_id = _organization_id
    AND ep.login_pin = _pin
    AND ep.is_active = true
    AND ep.is_approved = true
  LIMIT 1
$$;

-- Helper function to check if user can manage PINs (for kiosk settings access)
CREATE OR REPLACE FUNCTION public.can_manage_kiosk_settings(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employee_profiles
    WHERE user_id = _user_id
    AND (is_primary_owner = true OR is_super_admin = true)
    AND is_active = true
    AND is_approved = true
  )
$$;

-- Trigger to protect primary owner's PIN from being changed by others
CREATE OR REPLACE FUNCTION public.protect_primary_owner_pin()
RETURNS TRIGGER AS $$
BEGIN
  -- If updating login_pin on a primary owner's profile
  IF OLD.is_primary_owner = true AND OLD.login_pin IS DISTINCT FROM NEW.login_pin THEN
    -- Only the primary owner themselves can change their PIN
    IF auth.uid() != OLD.user_id THEN
      RAISE EXCEPTION 'Cannot change the Primary Owner''s PIN';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply trigger to employee_profiles
DROP TRIGGER IF EXISTS protect_primary_owner_pin_trigger ON public.employee_profiles;
CREATE TRIGGER protect_primary_owner_pin_trigger
  BEFORE UPDATE ON public.employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_primary_owner_pin();