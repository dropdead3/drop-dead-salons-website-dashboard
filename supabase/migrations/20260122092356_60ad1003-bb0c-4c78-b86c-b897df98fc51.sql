-- Fix the can_approve_admin_role function to only require is_super_admin
-- Super Admins should be able to approve admin roles without needing the admin role themselves

CREATE OR REPLACE FUNCTION public.can_approve_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employee_profiles ep
    WHERE ep.user_id = _user_id
      AND ep.is_super_admin = true
      AND ep.is_approved = true
  )
$$;