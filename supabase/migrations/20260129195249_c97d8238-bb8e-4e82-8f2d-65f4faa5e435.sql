-- Platform roles table (separate from salon app_role enum)
CREATE TABLE public.platform_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('platform_owner', 'platform_admin', 'platform_support', 'platform_developer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

-- Helper function to check platform role
CREATE OR REPLACE FUNCTION public.has_platform_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is any type of platform user
CREATE OR REPLACE FUNCTION public.is_platform_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles WHERE user_id = _user_id
  )
$$;

-- RLS Policies for platform_roles
-- Platform users can view their own roles
CREATE POLICY "Users can view own platform roles"
ON public.platform_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Platform owners and admins can view all platform roles
CREATE POLICY "Platform admins can view all platform roles"
ON public.platform_roles
FOR SELECT
TO authenticated
USING (
  public.has_platform_role(auth.uid(), 'platform_owner') OR 
  public.has_platform_role(auth.uid(), 'platform_admin')
);

-- Only platform owners and admins can insert new platform roles
CREATE POLICY "Platform admins can insert platform roles"
ON public.platform_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_platform_role(auth.uid(), 'platform_owner') OR 
  public.has_platform_role(auth.uid(), 'platform_admin')
);

-- Only platform owners can update roles
CREATE POLICY "Platform owners can update platform roles"
ON public.platform_roles
FOR UPDATE
TO authenticated
USING (public.has_platform_role(auth.uid(), 'platform_owner'))
WITH CHECK (public.has_platform_role(auth.uid(), 'platform_owner'));

-- Only platform owners can delete roles (except cannot delete self)
CREATE POLICY "Platform owners can delete platform roles"
ON public.platform_roles
FOR DELETE
TO authenticated
USING (
  public.has_platform_role(auth.uid(), 'platform_owner') AND 
  user_id != auth.uid()
);