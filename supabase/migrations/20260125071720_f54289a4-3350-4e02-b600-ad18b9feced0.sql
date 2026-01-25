-- Add manage_schedule_requests permission
INSERT INTO permissions (name, display_name, description, category)
VALUES ('manage_schedule_requests', 'Manage Schedule Requests', 'Review and approve/deny employee schedule change requests', 'Scheduling')
ON CONFLICT (name) DO NOTHING;

-- Grant to admin, manager, and super_admin roles by default
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM permissions WHERE name = 'manage_schedule_requests'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'manager'::app_role, id FROM permissions WHERE name = 'manage_schedule_requests'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'super_admin'::app_role, id FROM permissions WHERE name = 'manage_schedule_requests'
ON CONFLICT DO NOTHING;