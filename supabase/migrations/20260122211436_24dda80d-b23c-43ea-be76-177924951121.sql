-- Create a table for role templates
CREATE TABLE public.role_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    color TEXT NOT NULL DEFAULT 'blue',
    icon TEXT NOT NULL DEFAULT 'User',
    category TEXT NOT NULL DEFAULT 'other',
    permission_ids UUID[] NOT NULL DEFAULT '{}',
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view role templates"
ON public.role_templates
FOR SELECT
USING (true);

CREATE POLICY "Super admins can insert role templates"
ON public.role_templates
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.is_coach_or_admin(auth.uid())
);

CREATE POLICY "Super admins can update role templates"
ON public.role_templates
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.is_coach_or_admin(auth.uid())
);

CREATE POLICY "Super admins can delete role templates"
ON public.role_templates
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.is_coach_or_admin(auth.uid())
);

-- Seed with built-in templates based on existing role patterns
INSERT INTO public.role_templates (name, display_name, description, color, icon, category, is_system, permission_ids)
SELECT 
  'stylist_template',
  'Stylist Template',
  'Standard permissions for stylists - access to client tools, training, and personal stats',
  'purple',
  'Scissors',
  'operations',
  true,
  ARRAY(SELECT id FROM permissions WHERE name IN (
    'view_command_center', 'view_team_directory', 'view_training',
    'access_client_engine', 'ring_the_bell', 'view_leaderboard', 'view_own_stats',
    'view_assistant_schedule', 'request_assistant', 'schedule_meetings',
    'view_onboarding', 'view_handbooks'
  ));

INSERT INTO public.role_templates (name, display_name, description, color, icon, category, is_system, permission_ids)
SELECT 
  'manager_template',
  'Manager Template',
  'Extended permissions for managers - includes team oversight and announcements',
  'blue',
  'Users',
  'leadership',
  true,
  ARRAY(SELECT id FROM permissions WHERE name IN (
    'view_command_center', 'view_team_directory', 'view_training', 
    'access_client_engine', 'ring_the_bell', 'view_leaderboard', 'view_own_stats',
    'view_assistant_schedule', 'request_assistant', 'schedule_meetings',
    'view_onboarding', 'view_handbooks',
    'view_team_overview', 'manage_announcements', 'view_all_stats'
  ));

INSERT INTO public.role_templates (name, display_name, description, color, icon, category, is_system, permission_ids)
SELECT 
  'assistant_template',
  'Assistant Template',
  'Basic permissions for assistants - focus on learning and support tasks',
  'cyan',
  'Heart',
  'support',
  true,
  ARRAY(SELECT id FROM permissions WHERE name IN (
    'view_command_center', 'view_team_directory', 'view_training',
    'view_leaderboard', 'view_assistant_schedule', 'schedule_meetings',
    'view_onboarding', 'view_handbooks', 'view_my_graduation'
  ));

INSERT INTO public.role_templates (name, display_name, description, color, icon, category, is_system, permission_ids)
SELECT 
  'minimal_template',
  'Minimal Access Template',
  'Very limited permissions - only basic dashboard and handbooks',
  'gray',
  'Eye',
  'other',
  true,
  ARRAY(SELECT id FROM permissions WHERE name IN (
    'view_command_center', 'view_team_directory', 'view_handbooks'
  ));