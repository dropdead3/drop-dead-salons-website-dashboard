-- Fix is_coach_or_admin to include super_admin role
-- Super Admins should have coach/admin access

CREATE OR REPLACE FUNCTION public.is_coach_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager', 'super_admin')
  )
  OR EXISTS (
    SELECT 1
    FROM public.employee_profiles
    WHERE user_id = _user_id
      AND is_super_admin = true
  )
$$;