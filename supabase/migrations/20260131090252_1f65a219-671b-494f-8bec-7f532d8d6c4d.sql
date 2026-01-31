-- Add new permissions with display_name
INSERT INTO public.permissions (name, display_name, description, category)
VALUES 
  ('manage_inventory', 'Manage Inventory', 'View and edit products, assign SKUs and barcodes', 'Operations'),
  ('process_retail_sales', 'Process Retail Sales', 'Use the register/POS to ring up products', 'Operations')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles (casting to app_role enum)
INSERT INTO public.role_permissions (role, permission_id)
SELECT r.name::app_role, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('admin', 'manager', 'super_admin')
AND p.name IN ('manage_inventory', 'process_retail_sales')
ON CONFLICT DO NOTHING;

-- Assign process_retail_sales to receptionist
INSERT INTO public.role_permissions (role, permission_id)
SELECT r.name::app_role, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'receptionist'
AND p.name = 'process_retail_sales'
ON CONFLICT DO NOTHING;