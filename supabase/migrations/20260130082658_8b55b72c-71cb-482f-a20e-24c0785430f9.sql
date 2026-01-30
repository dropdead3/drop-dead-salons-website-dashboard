-- Create platform_permissions table for granular platform access control
CREATE TABLE public.platform_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create platform_role_permissions junction table
CREATE TABLE public.platform_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('platform_owner', 'platform_admin', 'platform_support', 'platform_developer')),
  permission_id uuid NOT NULL REFERENCES public.platform_permissions(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id),
  UNIQUE (role, permission_id)
);

-- Enable RLS
ALTER TABLE public.platform_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_role_permissions ENABLE ROW LEVEL SECURITY;

-- Platform permissions are readable by platform users
CREATE POLICY "Platform users can view permissions" ON public.platform_permissions
  FOR SELECT TO authenticated
  USING (public.is_platform_user(auth.uid()));

-- Platform role permissions are viewable by platform users
CREATE POLICY "Platform users can view role permissions" ON public.platform_role_permissions
  FOR SELECT TO authenticated
  USING (public.is_platform_user(auth.uid()));

-- Only platform_owner and platform_admin can modify permissions
CREATE POLICY "Platform admins can manage role permissions" ON public.platform_role_permissions
  FOR ALL TO authenticated
  USING (
    public.has_platform_role(auth.uid(), 'platform_owner') OR 
    public.has_platform_role(auth.uid(), 'platform_admin')
  )
  WITH CHECK (
    public.has_platform_role(auth.uid(), 'platform_owner') OR 
    public.has_platform_role(auth.uid(), 'platform_admin')
  );

-- Insert default platform permissions
INSERT INTO public.platform_permissions (name, display_name, description, category) VALUES
  -- Account Management
  ('view_accounts', 'View Accounts', 'View list of all organization accounts', 'accounts'),
  ('create_accounts', 'Create Accounts', 'Create new organization accounts', 'accounts'),
  ('edit_accounts', 'Edit Accounts', 'Modify organization account details', 'accounts'),
  ('delete_accounts', 'Delete Accounts', 'Remove organization accounts', 'accounts'),
  ('impersonate_accounts', 'Impersonate Accounts', 'Switch context to manage as specific account', 'accounts'),
  
  -- Migrations
  ('view_migrations', 'View Migrations', 'View data migration status and history', 'migrations'),
  ('run_migrations', 'Run Migrations', 'Execute data migrations for accounts', 'migrations'),
  ('cancel_migrations', 'Cancel Migrations', 'Cancel in-progress migrations', 'migrations'),
  
  -- Revenue
  ('view_revenue', 'View Revenue', 'Access revenue dashboard and metrics', 'revenue'),
  ('manage_subscriptions', 'Manage Subscriptions', 'Modify account subscription plans', 'revenue'),
  ('process_refunds', 'Process Refunds', 'Issue refunds for payments', 'revenue'),
  
  -- Platform Settings
  ('view_platform_settings', 'View Platform Settings', 'View platform configuration', 'settings'),
  ('manage_platform_settings', 'Manage Platform Settings', 'Modify platform-wide settings', 'settings'),
  ('manage_platform_team', 'Manage Platform Team', 'Add/remove platform team members', 'settings'),
  
  -- Support
  ('view_support_tickets', 'View Support Tickets', 'Access customer support requests', 'support'),
  ('respond_to_tickets', 'Respond to Tickets', 'Reply to support requests', 'support'),
  ('escalate_tickets', 'Escalate Tickets', 'Escalate issues to higher tier', 'support'),
  
  -- Development
  ('view_audit_logs', 'View Audit Logs', 'Access platform audit trail', 'development'),
  ('view_system_health', 'View System Health', 'Monitor system status and metrics', 'development'),
  ('manage_feature_flags', 'Manage Feature Flags', 'Toggle platform feature flags', 'development');

-- Grant all permissions to platform_owner
INSERT INTO public.platform_role_permissions (role, permission_id)
SELECT 'platform_owner', id FROM public.platform_permissions;

-- Grant most permissions to platform_admin (except team management)
INSERT INTO public.platform_role_permissions (role, permission_id)
SELECT 'platform_admin', id FROM public.platform_permissions 
WHERE name NOT IN ('delete_accounts', 'manage_platform_team', 'process_refunds');

-- Grant limited permissions to platform_support
INSERT INTO public.platform_role_permissions (role, permission_id)
SELECT 'platform_support', id FROM public.platform_permissions 
WHERE name IN ('view_accounts', 'view_migrations', 'view_support_tickets', 'respond_to_tickets', 'escalate_tickets', 'view_audit_logs');

-- Grant developer-focused permissions to platform_developer
INSERT INTO public.platform_role_permissions (role, permission_id)
SELECT 'platform_developer', id FROM public.platform_permissions 
WHERE name IN ('view_accounts', 'view_migrations', 'run_migrations', 'view_audit_logs', 'view_system_health', 'manage_feature_flags');