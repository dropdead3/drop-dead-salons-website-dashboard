-- Add platform admin permissions to permissions table
INSERT INTO public.permissions (name, display_name, description, category) VALUES
('view_platform_admin', 'View Platform Admin', 'Access the platform admin dashboard for managing salon organizations', 'Platform'),
('manage_organizations', 'Manage Organizations', 'Create, edit, and manage salon organization accounts', 'Platform'),
('view_all_organizations', 'View All Organizations', 'View all salon organizations across the platform', 'Platform'),
('perform_migrations', 'Perform Migrations', 'Execute data migrations and imports for organizations', 'Platform')
ON CONFLICT (name) DO NOTHING;

-- Grant platform permissions to super_admin role
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'super_admin'::app_role, p.id
FROM public.permissions p
WHERE p.name IN ('view_platform_admin', 'manage_organizations', 'view_all_organizations', 'perform_migrations')
ON CONFLICT (role, permission_id) DO NOTHING;