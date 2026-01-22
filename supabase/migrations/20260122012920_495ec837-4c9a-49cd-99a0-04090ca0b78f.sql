-- Add policy for public access to homepage-visible stylists
-- This allows anonymous users to see stylists on the public website homepage
CREATE POLICY "Public can view homepage-visible profiles"
  ON public.employee_profiles
  FOR SELECT
  USING (is_active = true AND homepage_visible = true);