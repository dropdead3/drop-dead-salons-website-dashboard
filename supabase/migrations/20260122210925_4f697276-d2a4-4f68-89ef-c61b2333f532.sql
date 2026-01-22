-- Drop existing policies on role_permissions
DROP POLICY IF EXISTS "Only admins can insert role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Only admins can update role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Only admins can delete role permissions" ON public.role_permissions;

-- Create new policies that check for both admin role AND super_admin status
CREATE POLICY "Super admins can insert role permissions" 
ON public.role_permissions 
FOR INSERT 
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.is_coach_or_admin(auth.uid())
);

CREATE POLICY "Super admins can update role permissions" 
ON public.role_permissions 
FOR UPDATE 
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.is_coach_or_admin(auth.uid())
);

CREATE POLICY "Super admins can delete role permissions" 
ON public.role_permissions 
FOR DELETE 
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.is_coach_or_admin(auth.uid())
);