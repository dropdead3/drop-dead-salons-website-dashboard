-- Add missing permissions for pages that currently use role-based checks

-- My Graduation page (currently restricted to stylist_assistant by roles)
INSERT INTO permissions (name, display_name, description, category)
VALUES ('view_my_graduation', 'View My Graduation', 'Access the graduation requirements and submission page', 'Growth')
ON CONFLICT (name) DO NOTHING;

-- View/Edit any profile (currently super_admin only)
INSERT INTO permissions (name, display_name, description, category)
VALUES ('view_any_profile', 'View Any Profile', 'View and edit any team member profile', 'Administration')
ON CONFLICT (name) DO NOTHING;

-- Command Center Console (currently super_admin only)
INSERT INTO permissions (name, display_name, description, category)
VALUES ('manage_visibility_console', 'Manage Visibility Console', 'Access the Command Center Console to control dashboard element visibility', 'Administration')
ON CONFLICT (name) DO NOTHING;

-- Dashboard Build page (currently super_admin only)
INSERT INTO permissions (name, display_name, description, category)
VALUES ('view_dashboard_build', 'View Dashboard Build', 'Access the Dashboard Build development page', 'Administration')
ON CONFLICT (name) DO NOTHING;

-- Program Editor (currently super_admin only)
INSERT INTO permissions (name, display_name, description, category)
VALUES ('manage_program_editor', 'Manage Program Editor', 'Edit program weeks, tasks, and resources', 'Administration')
ON CONFLICT (name) DO NOTHING;

-- Program Analytics (currently super_admin only)
INSERT INTO permissions (name, display_name, description, category)
VALUES ('view_program_analytics', 'View Program Analytics', 'Access program completion and performance analytics', 'Management')
ON CONFLICT (name) DO NOTHING;

-- Grant these new permissions to admin role by default
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions WHERE name IN (
  'view_my_graduation',
  'view_any_profile', 
  'manage_visibility_console',
  'view_dashboard_build',
  'manage_program_editor',
  'view_program_analytics'
)
ON CONFLICT DO NOTHING;

-- Grant view_my_graduation to stylist_assistant role (current behavior)
INSERT INTO role_permissions (role, permission_id)
SELECT 'stylist_assistant', id FROM permissions WHERE name = 'view_my_graduation'
ON CONFLICT DO NOTHING;

-- Grant view_program_analytics to manager role
INSERT INTO role_permissions (role, permission_id)
SELECT 'manager', id FROM permissions WHERE name = 'view_program_analytics'
ON CONFLICT DO NOTHING;