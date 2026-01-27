-- Add permission for viewing analytics across all locations
INSERT INTO permissions (id, name, display_name, description, category)
VALUES (
  gen_random_uuid(),
  'view_all_locations_analytics',
  'View All Locations Analytics',
  'View analytics and stats across all salon locations',
  'Management'
);

-- Grant to super_admin by default
INSERT INTO role_permissions (role, permission_id)
SELECT 'super_admin', id FROM permissions WHERE name = 'view_all_locations_analytics';