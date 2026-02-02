-- Add the view_clients permission
INSERT INTO public.permissions (name, display_name, description, category)
VALUES ('view_clients', 'View Client Directory', 'Access the Client Directory page to view client data', 'clients')
ON CONFLICT (name) DO NOTHING;

-- Grant view_clients permission to all roles (everyone can see the page, but tabs are permission-gated in UI)
INSERT INTO public.role_permissions (role, permission_id)
SELECT r.role, p.id
FROM (
  SELECT unnest(enum_range(NULL::app_role)) as role
) r
CROSS JOIN public.permissions p
WHERE p.name = 'view_clients'
ON CONFLICT (role, permission_id) DO NOTHING;