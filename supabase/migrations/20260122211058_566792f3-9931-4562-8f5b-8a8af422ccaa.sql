-- Create a table to store system default permissions per role
CREATE TABLE public.role_permission_defaults (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role app_role NOT NULL,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(role, permission_id)
);

-- Enable RLS
ALTER TABLE public.role_permission_defaults ENABLE ROW LEVEL SECURITY;

-- RLS Policies - only super admins can manage defaults
CREATE POLICY "Anyone can view role permission defaults"
ON public.role_permission_defaults
FOR SELECT
USING (true);

CREATE POLICY "Super admins can insert role permission defaults"
ON public.role_permission_defaults
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.is_coach_or_admin(auth.uid())
);

CREATE POLICY "Super admins can update role permission defaults"
ON public.role_permission_defaults
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.is_coach_or_admin(auth.uid())
);

CREATE POLICY "Super admins can delete role permission defaults"
ON public.role_permission_defaults
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.is_coach_or_admin(auth.uid())
);

-- Seed with current role_permissions as defaults
INSERT INTO public.role_permission_defaults (role, permission_id)
SELECT role, permission_id FROM public.role_permissions
ON CONFLICT (role, permission_id) DO NOTHING;