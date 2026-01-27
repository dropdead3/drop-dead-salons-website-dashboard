-- Add dashboard_layout column to store user's dashboard customization
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS dashboard_layout JSONB DEFAULT NULL;

-- Create dashboard_layout_templates table for role-based defaults
CREATE TABLE IF NOT EXISTS public.dashboard_layout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  layout JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.dashboard_layout_templates ENABLE ROW LEVEL SECURITY;

-- Read policy: All authenticated users can view templates
CREATE POLICY "Anyone can view dashboard templates"
ON public.dashboard_layout_templates FOR SELECT TO authenticated
USING (true);

-- Write policy: Only admins can manage templates
CREATE POLICY "Admins can manage dashboard templates"
ON public.dashboard_layout_templates FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'manager')
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_dashboard_layout_templates_updated_at
BEFORE UPDATE ON public.dashboard_layout_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default templates for each role category
INSERT INTO public.dashboard_layout_templates (role_name, display_name, description, layout, is_default) VALUES
('leadership', 'Leadership View', 'Default layout for managers and admins with analytics focus', 
 '{"sections": ["command_center", "announcements", "widgets"], "pinnedCards": ["sales_overview", "top_performers", "capacity_utilization"], "widgets": ["changelog", "birthdays", "anniversaries"]}', 
 true),
('stylist', 'Stylist View', 'Default layout for stylists with client and program focus',
 '{"sections": ["quick_actions", "client_engine", "schedule", "tasks"], "widgets": ["schedule", "changelog"]}',
 true),
('operations', 'Operations View', 'Default layout for front desk and operations support',
 '{"sections": ["quick_stats", "schedule", "tasks", "announcements"], "widgets": ["schedule", "birthdays"]}',
 true),
('assistant', 'Assistant View', 'Default layout for stylist assistants',
 '{"sections": ["quick_actions", "schedule", "tasks"], "widgets": ["schedule", "changelog"]}',
 true)
ON CONFLICT (role_name) DO NOTHING;