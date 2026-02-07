-- Step 2: Insert role metadata into roles table
INSERT INTO public.roles (
  name, 
  display_name, 
  description, 
  color, 
  icon, 
  category, 
  sort_order, 
  is_system, 
  is_active
) VALUES (
  'bookkeeper',
  'Bookkeeper',
  'External accounting access for payroll, sales data, and financial reports',
  'emerald',
  'Calculator',
  'operations',
  15,
  true,
  true
) ON CONFLICT (name) DO NOTHING;

-- Create new bookkeeper-specific permissions
INSERT INTO public.permissions (name, display_name, description, category)
VALUES 
  ('view_sales_analytics', 'View Sales Analytics', 'Access sales dashboards and revenue reports', 'finances'),
  ('export_financial_data', 'Export Financial Data', 'Download CSV/PDF reports for payroll and sales', 'finances')
ON CONFLICT (name) DO NOTHING;

-- Assign default permissions to bookkeeper role
INSERT INTO public.role_permissions (role, permission_id, granted_by)
SELECT 
  'bookkeeper'::app_role,
  p.id,
  NULL
FROM public.permissions p
WHERE p.name IN (
  'manage_payroll',
  'view_payroll_reports',
  'manage_employee_compensation',
  'view_transactions',
  'view_sales_analytics',
  'view_all_stats',
  'view_all_locations_analytics',
  'view_rent_analytics',
  'export_financial_data',
  'view_command_center'
)
ON CONFLICT DO NOTHING;