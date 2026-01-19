-- Create table for dashboard element visibility per role
CREATE TABLE public.dashboard_element_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  element_key text NOT NULL,
  element_name text NOT NULL,
  element_category text NOT NULL,
  role app_role NOT NULL,
  is_visible boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(element_key, role)
);

-- Enable RLS
ALTER TABLE public.dashboard_element_visibility ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read visibility settings
CREATE POLICY "Anyone can view dashboard visibility settings"
ON public.dashboard_element_visibility
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only super admins can modify visibility settings
CREATE POLICY "Super admins can manage visibility settings"
ON public.dashboard_element_visibility
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employee_profiles
    WHERE user_id = auth.uid()
    AND is_super_admin = true
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_dashboard_element_visibility_updated_at
BEFORE UPDATE ON public.dashboard_element_visibility
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default visibility settings for all dashboard elements and roles
INSERT INTO public.dashboard_element_visibility (element_key, element_name, element_category, role, is_visible)
SELECT 
  element.key,
  element.name,
  element.category,
  role.role,
  true
FROM (
  VALUES 
    ('quick_stats', 'Quick Stats Cards', 'Dashboard Cards'),
    ('todays_schedule', 'Today''s Schedule', 'Dashboard Cards'),
    ('my_tasks', 'My Tasks', 'Dashboard Cards'),
    ('announcements', 'Announcements', 'Dashboard Cards'),
    ('team_overview', 'Team Overview', 'Leadership Cards'),
    ('stylists_overview', 'Stylists Overview', 'Leadership Cards'),
    ('client_engine', 'Client Engine Program', 'Program Cards'),
    ('quick_actions', 'Quick Actions', 'Actions'),
    ('ring_the_bell_action', 'Ring the Bell Action', 'Actions'),
    ('log_metrics_action', 'Log Metrics Action', 'Actions'),
    ('training_action', 'Training Action', 'Actions'),
    ('handbooks_action', 'Handbooks Action', 'Actions')
) AS element(key, name, category)
CROSS JOIN (
  SELECT unnest(enum_range(NULL::app_role)) AS role
) AS role;