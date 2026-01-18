-- Create permissions table to define all available permissions
CREATE TABLE public.permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role_permissions junction table to link roles to permissions
CREATE TABLE public.role_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role app_role NOT NULL,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    granted_by UUID REFERENCES auth.users(id),
    UNIQUE(role, permission_id)
);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Permissions are readable by all authenticated users
CREATE POLICY "Permissions are viewable by authenticated users"
ON public.permissions FOR SELECT TO authenticated
USING (true);

-- Only admins can modify permissions
CREATE POLICY "Only admins can insert permissions"
ON public.permissions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update permissions"
ON public.permissions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete permissions"
ON public.permissions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Role permissions are readable by all authenticated users
CREATE POLICY "Role permissions are viewable by authenticated users"
ON public.role_permissions FOR SELECT TO authenticated
USING (true);

-- Only admins can modify role permissions
CREATE POLICY "Only admins can insert role permissions"
ON public.role_permissions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update role permissions"
ON public.role_permissions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete role permissions"
ON public.role_permissions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Seed default permissions
INSERT INTO public.permissions (name, display_name, description, category) VALUES
-- Dashboard & Navigation
('view_command_center', 'View Command Center', 'Access the main dashboard command center', 'Dashboard'),
('view_team_directory', 'View Team Directory', 'View the team directory', 'Dashboard'),

-- Growth & Programs
('view_training', 'View Training', 'Access training videos and materials', 'Growth'),
('access_client_engine', 'Access Client Engine', 'Use the Client Engine program', 'Growth'),
('ring_the_bell', 'Ring the Bell', 'Submit ring the bell entries', 'Growth'),
('view_leaderboard', 'View Leaderboard', 'View the team leaderboard', 'Growth'),
('view_own_stats', 'View Own Stats', 'View personal statistics', 'Growth'),

-- Scheduling & Assistance
('view_assistant_schedule', 'View Assistant Schedule', 'View the assistant schedule', 'Scheduling'),
('request_assistant', 'Request Assistant', 'Submit assistant requests', 'Scheduling'),
('manage_assistant_schedule', 'Manage Assistant Schedule', 'Accept/manage assistant requests', 'Scheduling'),
('schedule_meetings', 'Schedule 1:1 Meetings', 'Schedule one-on-one meetings', 'Scheduling'),

-- Housekeeping
('view_onboarding', 'View Onboarding', 'Access onboarding materials', 'Housekeeping'),
('view_handbooks', 'View Handbooks', 'View team handbooks', 'Housekeeping'),

-- Management
('view_team_overview', 'View Team Overview', 'Access team overview and reports', 'Management'),
('manage_announcements', 'Manage Announcements', 'Create and manage announcements', 'Management'),
('view_all_stats', 'View All Stats', 'View statistics for all team members', 'Management'),

-- Administration
('approve_accounts', 'Approve Accounts', 'Approve new user accounts', 'Administration'),
('manage_user_roles', 'Manage User Roles', 'Assign and remove user roles', 'Administration'),
('manage_handbooks', 'Manage Handbooks', 'Upload and manage handbooks', 'Administration'),
('manage_homepage_stylists', 'Manage Homepage Stylists', 'Control which stylists appear on homepage', 'Administration'),
('manage_settings', 'Manage Settings', 'Access system settings', 'Administration'),
('grant_super_admin', 'Grant Super Admin', 'Grant super admin status to users', 'Administration');

-- Assign default permissions to roles
-- Admin gets all permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin', id FROM public.permissions;

-- Manager permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'manager', id FROM public.permissions 
WHERE name IN (
    'view_command_center', 'view_team_directory', 'view_training', 
    'access_client_engine', 'ring_the_bell', 'view_leaderboard', 'view_own_stats',
    'view_assistant_schedule', 'request_assistant', 'schedule_meetings',
    'view_onboarding', 'view_handbooks',
    'view_team_overview', 'manage_announcements', 'view_all_stats'
);

-- Stylist permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'stylist', id FROM public.permissions 
WHERE name IN (
    'view_command_center', 'view_team_directory', 'view_training',
    'access_client_engine', 'ring_the_bell', 'view_leaderboard', 'view_own_stats',
    'view_assistant_schedule', 'request_assistant', 'schedule_meetings',
    'view_onboarding', 'view_handbooks'
);

-- Receptionist permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'receptionist', id FROM public.permissions 
WHERE name IN (
    'view_command_center', 'view_team_directory', 'view_training',
    'view_leaderboard', 'schedule_meetings',
    'view_onboarding', 'view_handbooks'
);

-- Assistant permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'assistant', id FROM public.permissions 
WHERE name IN (
    'view_command_center', 'view_team_directory', 'view_training',
    'view_leaderboard', 'view_assistant_schedule', 'manage_assistant_schedule',
    'schedule_meetings', 'view_onboarding', 'view_handbooks'
);