-- Add payroll permissions to the permissions table
INSERT INTO public.permissions (name, display_name, description, category) VALUES
  ('manage_payroll', 'Manage Payroll', 'Run payroll and manage payroll settings', 'Payroll'),
  ('view_payroll_reports', 'View Payroll Reports', 'View payroll history and reports', 'Payroll'),
  ('manage_employee_compensation', 'Manage Employee Compensation', 'Edit pay rates and employee payroll settings', 'Payroll')
ON CONFLICT (name) DO NOTHING;

-- Grant payroll permissions to super_admin role
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'super_admin'::app_role, id FROM public.permissions 
WHERE name IN ('manage_payroll', 'view_payroll_reports', 'manage_employee_compensation')
ON CONFLICT DO NOTHING;

-- Grant payroll permissions to admin role
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions 
WHERE name IN ('manage_payroll', 'view_payroll_reports', 'manage_employee_compensation')
ON CONFLICT DO NOTHING;