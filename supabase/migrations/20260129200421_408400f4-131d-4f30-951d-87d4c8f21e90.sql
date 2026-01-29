-- =====================================================
-- PHASE 1: Multi-Tenant SaaS Foundation
-- Organizations, Organization Admins, and Data Isolation
-- =====================================================

-- 1. Create Organizations Table (Core Tenant Entity)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'churned')),
  onboarding_stage TEXT DEFAULT 'new' CHECK (onboarding_stage IN ('new', 'importing', 'training', 'live')),
  subscription_tier TEXT DEFAULT 'standard',
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  source_software TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  timezone TEXT DEFAULT 'America/Chicago',
  created_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT organizations_slug_check CHECK (slug ~ '^[a-z0-9-]+$')
);

-- 2. Create Organization Admins Table (Org-Level Access Control)
CREATE TABLE public.organization_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('owner', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- 3. Create Platform Audit Log Table
CREATE TABLE public.platform_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Add organization_id to Core Data Tables (nullable initially for migration)
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.employee_profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 5. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);
CREATE INDEX IF NOT EXISTS idx_organization_admins_user ON public.organization_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_admins_org ON public.organization_admins(organization_id);
CREATE INDEX IF NOT EXISTS idx_locations_org ON public.locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_org ON public.employee_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org ON public.appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_org ON public.services(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org ON public.user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_log_org ON public.platform_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_log_user ON public.platform_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_audit_log_created ON public.platform_audit_log(created_at DESC);

-- 6. Helper Function: Check if user belongs to an organization
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_admins 
    WHERE user_id = _user_id AND organization_id = _org_id
  )
  OR EXISTS (
    SELECT 1 FROM public.employee_profiles 
    WHERE user_id = _user_id AND organization_id = _org_id
  )
  OR public.is_platform_user(_user_id)
$$;

-- 7. Helper Function: Get user's primary organization
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT organization_id FROM public.organization_admins WHERE user_id = _user_id LIMIT 1),
    (SELECT organization_id FROM public.employee_profiles WHERE user_id = _user_id AND organization_id IS NOT NULL LIMIT 1)
  )
$$;

-- 8. Helper Function: Check if user is org admin
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_admins 
    WHERE user_id = _user_id AND organization_id = _org_id
  )
  OR public.is_platform_user(_user_id)
$$;

-- 9. Enable RLS on New Tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_log ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for Organizations Table
CREATE POLICY "Platform users can view all organizations"
ON public.organizations FOR SELECT
USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Users can view their own organization"
ON public.organizations FOR SELECT
USING (public.user_belongs_to_org(auth.uid(), id));

CREATE POLICY "Platform users can insert organizations"
ON public.organizations FOR INSERT
WITH CHECK (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform users can update organizations"
ON public.organizations FOR UPDATE
USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform owners can delete organizations"
ON public.organizations FOR DELETE
USING (public.has_platform_role(auth.uid(), 'platform_owner'));

-- 11. RLS Policies for Organization Admins Table
CREATE POLICY "Platform users can view all org admins"
ON public.organization_admins FOR SELECT
USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Users can view their org's admins"
ON public.organization_admins FOR SELECT
USING (public.user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Platform users can manage org admins"
ON public.organization_admins FOR ALL
USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Org owners can manage their org admins"
ON public.organization_admins FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_admins oa
    WHERE oa.user_id = auth.uid() 
    AND oa.organization_id = organization_id 
    AND oa.role = 'owner'
  )
);

-- 12. RLS Policies for Platform Audit Log
CREATE POLICY "Platform users can view audit logs"
ON public.platform_audit_log FOR SELECT
USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform users can insert audit logs"
ON public.platform_audit_log FOR INSERT
WITH CHECK (public.is_platform_user(auth.uid()));

-- 13. Updated At Trigger for Organizations
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Function to Log Platform Actions
CREATE OR REPLACE FUNCTION public.log_platform_action(
  _org_id uuid,
  _action text,
  _entity_type text DEFAULT NULL,
  _entity_id uuid DEFAULT NULL,
  _details jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id uuid;
BEGIN
  INSERT INTO public.platform_audit_log (
    organization_id, user_id, action, entity_type, entity_id, details
  ) VALUES (
    _org_id, auth.uid(), _action, _entity_type, _entity_id, _details
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;