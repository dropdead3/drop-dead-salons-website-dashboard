-- Create helper function to check if user can view all clients
CREATE OR REPLACE FUNCTION public.can_view_all_clients(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager', 'super_admin', 'receptionist')
  )
  OR EXISTS (
    SELECT 1
    FROM public.employee_profiles
    WHERE user_id = _user_id
      AND is_super_admin = true
  )
$$;

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Stylists can view their own clients" ON public.phorest_clients;

-- Create new inclusive policy that allows role-based access
CREATE POLICY "Users can view clients based on role"
ON public.phorest_clients
FOR SELECT
USING (
  auth.uid() = preferred_stylist_id 
  OR public.can_view_all_clients(auth.uid())
);