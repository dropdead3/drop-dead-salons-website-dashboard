-- Insert missing Command Center visibility elements for all active roles
INSERT INTO dashboard_element_visibility (element_key, element_name, element_category, role, is_visible)
SELECT 
  e.element_key,
  e.element_name,
  e.element_category,
  r.name::app_role,
  CASE 
    WHEN r.name IN ('super_admin', 'admin', 'manager') THEN true 
    ELSE false 
  END as is_visible
FROM (
  VALUES 
    ('week_ahead_forecast', 'Forecasting', 'Leadership Widgets'),
    ('capacity_utilization', 'Capacity Utilization', 'Leadership Widgets'),
    ('website_analytics', 'Website Traffic', 'Leadership Widgets')
) AS e(element_key, element_name, element_category)
CROSS JOIN roles r
WHERE r.is_active = true
ON CONFLICT (element_key, role) DO NOTHING;