-- Drop old update policy that's missing super_admin
DROP POLICY IF EXISTS "Admins can update site_settings" ON site_settings;

-- Create new policy with super_admin included
CREATE POLICY "Admins can update site_settings" ON site_settings
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'manager', 'super_admin')
  )
  OR EXISTS (
    SELECT 1 FROM employee_profiles
    WHERE employee_profiles.user_id = auth.uid()
      AND employee_profiles.is_super_admin = true
  )
);