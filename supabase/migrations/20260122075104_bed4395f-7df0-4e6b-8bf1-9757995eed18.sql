-- Create the roles table for dynamic role management
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT 'gray',
  icon TEXT NOT NULL DEFAULT 'User',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert existing roles with their current metadata
INSERT INTO public.roles (name, display_name, description, color, icon, sort_order, is_system, is_active) VALUES
  ('admin', 'Admin', 'Full access to all features and settings', 'red', 'Shield', 1, true, true),
  ('manager', 'Manager', 'Can manage team, view reports, and approve requests', 'purple', 'Crown', 2, true, true),
  ('stylist', 'Stylist', 'Access to stylist features and 75 Hard program', 'blue', 'Scissors', 3, true, true),
  ('receptionist', 'Receptionist', 'Front desk and scheduling access', 'green', 'Phone', 4, true, true),
  ('stylist_assistant', 'Stylist Assistant', 'Assists stylists with client services', 'cyan', 'Users', 5, false, true),
  ('admin_assistant', 'Admin Assistant', 'Provides administrative support to leadership', 'orange', 'ClipboardList', 6, false, true),
  ('operations_assistant', 'Operations Assistant', 'Supports daily salon operations', 'yellow', 'Settings', 7, false, true),
  ('assistant', 'Assistant', 'Legacy assistant role - deprecated', 'gray', 'User', 8, false, false);

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read roles
CREATE POLICY "Authenticated users can view roles"
ON public.roles
FOR SELECT
TO authenticated
USING (true);

-- Only super admins can insert roles
CREATE POLICY "Super admins can insert roles"
ON public.roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employee_profiles
    WHERE user_id = auth.uid()
    AND is_super_admin = true
  )
);

-- Only super admins can update roles
CREATE POLICY "Super admins can update roles"
ON public.roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employee_profiles
    WHERE user_id = auth.uid()
    AND is_super_admin = true
  )
);

-- Only super admins can delete non-system roles
CREATE POLICY "Super admins can delete non-system roles"
ON public.roles
FOR DELETE
TO authenticated
USING (
  is_system = false AND
  EXISTS (
    SELECT 1 FROM public.employee_profiles
    WHERE user_id = auth.uid()
    AND is_super_admin = true
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_roles_name ON public.roles(name);
CREATE INDEX idx_roles_active ON public.roles(is_active) WHERE is_active = true;
CREATE INDEX idx_roles_sort ON public.roles(sort_order);