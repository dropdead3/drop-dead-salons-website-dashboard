-- Update the public visibility policy to only show stylist/stylist_assistant roles
DROP POLICY IF EXISTS "Public can view homepage-visible profiles" ON public.employee_profiles;

CREATE POLICY "Public can view homepage-visible stylists"
  ON public.employee_profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true 
    AND homepage_visible = true
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = employee_profiles.user_id
      AND user_roles.role IN ('stylist', 'stylist_assistant')
    )
  );