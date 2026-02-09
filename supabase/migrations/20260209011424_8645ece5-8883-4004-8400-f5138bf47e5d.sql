-- Add column to persist user's active organization selection
ALTER TABLE public.employee_profiles 
  ADD COLUMN IF NOT EXISTS active_organization_id UUID REFERENCES public.organizations(id);

-- Create index for fast lookup of user's organizations
CREATE INDEX IF NOT EXISTS idx_org_admins_user_role 
  ON public.organization_admins(user_id, role);

-- Function to get all orgs a user has admin/owner access to
CREATE OR REPLACE FUNCTION public.get_user_accessible_organizations(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT organization_id 
  FROM public.organization_admins 
  WHERE user_id = _user_id
  UNION
  SELECT organization_id 
  FROM public.employee_profiles 
  WHERE user_id = _user_id AND organization_id IS NOT NULL
$$;

-- Helper function to check if user has multiple orgs
CREATE OR REPLACE FUNCTION public.is_multi_org_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT COUNT(DISTINCT organization_id) 
    FROM (
      SELECT organization_id FROM public.organization_admins WHERE user_id = _user_id
      UNION
      SELECT organization_id FROM public.employee_profiles WHERE user_id = _user_id AND organization_id IS NOT NULL
    ) orgs
  ) > 1
$$;