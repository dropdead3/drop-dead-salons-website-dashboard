-- Add run_reports permission for robust reports system
-- Allows permissioned admins to run and download reports (preview, CSV, PDF)

INSERT INTO public.permissions (name, display_name, description, category)
VALUES (
  'run_reports',
  'Run Reports',
  'Run and download reports (preview, CSV, PDF). Access to the Reports hub and export actions.',
  'admin'
)
ON CONFLICT (name) DO NOTHING;

-- Grant to super_admin, admin, manager, bookkeeper
INSERT INTO public.role_permissions (role, permission_id, granted_by)
SELECT 'super_admin'::app_role, p.id, NULL
FROM public.permissions p
WHERE p.name = 'run_reports'
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id, granted_by)
SELECT 'admin'::app_role, p.id, NULL
FROM public.permissions p
WHERE p.name = 'run_reports'
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id, granted_by)
SELECT 'manager'::app_role, p.id, NULL
FROM public.permissions p
WHERE p.name = 'run_reports'
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id, granted_by)
SELECT 'bookkeeper'::app_role, p.id, NULL
FROM public.permissions p
WHERE p.name = 'run_reports'
ON CONFLICT (role, permission_id) DO NOTHING;
