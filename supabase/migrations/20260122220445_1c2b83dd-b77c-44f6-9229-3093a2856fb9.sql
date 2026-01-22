-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Admins can update business settings" ON public.business_settings;

-- Create new policy that also checks for super_admin
CREATE POLICY "Admins can update business settings" 
ON public.business_settings 
FOR UPDATE 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM public.employee_profiles 
    WHERE user_id = auth.uid() 
    AND is_super_admin = true
  )
);

-- Also update INSERT policy
DROP POLICY IF EXISTS "Admins can insert business settings" ON public.business_settings;

CREATE POLICY "Admins can insert business settings" 
ON public.business_settings 
FOR INSERT 
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM public.employee_profiles 
    WHERE user_id = auth.uid() 
    AND is_super_admin = true
  )
);