-- Add manage_integrations permission for owner/super_admin only
INSERT INTO permissions (name, display_name, description, category) 
VALUES ('manage_integrations', 'Manage Integrations', 'Access to manage third-party integrations and connected services', 'Administration')
ON CONFLICT (name) DO NOTHING;

-- Grant this permission to super_admin role
INSERT INTO role_permissions (role, permission_id)
SELECT 'super_admin', id FROM permissions WHERE name = 'manage_integrations'
ON CONFLICT DO NOTHING;