
CREATE POLICY "Admins can insert site_settings"
  ON public.site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'manager', 'super_admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.employee_profiles
      WHERE employee_profiles.user_id = auth.uid()
      AND employee_profiles.is_super_admin = true
    )
  );
