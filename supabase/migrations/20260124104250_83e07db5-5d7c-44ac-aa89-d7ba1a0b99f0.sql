-- Trigger to auto-create visibility entries for new roles
CREATE OR REPLACE FUNCTION public.sync_visibility_for_new_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert visibility entries for all existing elements when a new role is created
  INSERT INTO public.dashboard_element_visibility (element_key, element_name, element_category, role, is_visible)
  SELECT DISTINCT element_key, element_name, element_category, NEW.name::app_role, true
  FROM public.dashboard_element_visibility
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_role_created ON public.roles;

-- Create trigger for new role creation
CREATE TRIGGER on_role_created
  AFTER INSERT ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_visibility_for_new_role();

-- Seed new visibility elements for all roles
-- Sales Dashboard elements
INSERT INTO public.dashboard_element_visibility (element_key, element_name, element_category, role, is_visible)
SELECT 
  unnest(ARRAY['sales_kpi_cards', 'sales_goal_progress', 'sales_historical_comparison', 'sales_overview_tab', 'sales_stylist_tab', 'sales_location_tab', 'sales_phorest_tab', 'sales_compare_tab', 'sales_analytics_tab', 'commission_calculator']) as element_key,
  unnest(ARRAY['KPI Cards', 'Goal Progress', 'Historical Comparison', 'Overview Tab', 'By Stylist Tab', 'By Location Tab', 'Phorest Staff Tab', 'Compare Tab', 'Analytics Tab', 'Commission Calculator']) as element_name,
  'Sales Dashboard' as element_category,
  r.name::app_role as role,
  true as is_visible
FROM public.roles r
WHERE r.is_active = true
ON CONFLICT DO NOTHING;

-- Team Overview elements
INSERT INTO public.dashboard_element_visibility (element_key, element_name, element_category, role, is_visible)
SELECT 
  unnest(ARRAY['team_coach_notes', 'team_weekly_wins', 'team_handbook_status', 'team_quick_stats']) as element_key,
  unnest(ARRAY['Coach Notes', 'Weekly Wins', 'Handbook Status', 'Quick Stats']) as element_name,
  'Team Overview' as element_category,
  r.name::app_role as role,
  true as is_visible
FROM public.roles r
WHERE r.is_active = true
ON CONFLICT DO NOTHING;

-- Client Engine Tracker elements
INSERT INTO public.dashboard_element_visibility (element_key, element_name, element_category, role, is_visible)
SELECT 
  unnest(ARRAY['engine_stats_cards', 'engine_pause_requests', 'engine_participant_details']) as element_key,
  unnest(ARRAY['Stats Cards', 'Pause Requests', 'Participant Details']) as element_name,
  'Client Engine Tracker' as element_category,
  r.name::app_role as role,
  true as is_visible
FROM public.roles r
WHERE r.is_active = true
ON CONFLICT DO NOTHING;