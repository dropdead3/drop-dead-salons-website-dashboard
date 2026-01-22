-- Drop and recreate the public policy to include anon role explicitly
DROP POLICY IF EXISTS "Public can view homepage-visible profiles" ON public.employee_profiles;

CREATE POLICY "Public can view homepage-visible profiles"
  ON public.employee_profiles
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND homepage_visible = true);