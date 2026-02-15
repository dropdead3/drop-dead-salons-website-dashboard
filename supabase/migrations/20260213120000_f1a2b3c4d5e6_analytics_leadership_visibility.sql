-- Seed visibility for new Analytics Leadership pinnable cards and Leadership tab.
-- Default visible for leadership roles (super_admin, admin, manager); hidden for others.
INSERT INTO public.dashboard_element_visibility (element_key, element_name, element_category, role, is_visible)
SELECT 
  e.element_key,
  e.element_name,
  e.element_category,
  r.name::app_role,
  CASE 
    WHEN r.name IN ('super_admin', 'admin', 'manager') THEN true 
    ELSE false 
  END AS is_visible
FROM (
  VALUES 
    ('analytics_leadership_tab', 'Leadership', 'Page Tabs'),
    ('executive_summary', 'Executive Summary', 'Command Center'),
    ('client_health', 'Client Health', 'Command Center'),
    ('daily_brief', 'Daily Brief', 'Command Center'),
    ('operational_health', 'Operational Health', 'Command Center'),
    ('locations_rollup', 'Locations Rollup', 'Command Center'),
    ('service_mix', 'Service Mix', 'Command Center'),
    ('retail_effectiveness', 'Retail Effectiveness', 'Command Center'),
    ('rebooking', 'Rebooking Rate', 'Command Center')
) AS e(element_key, element_name, element_category)
CROSS JOIN public.roles r
WHERE r.is_active = true
ON CONFLICT (element_key, role) DO NOTHING;
