
-- Create organization_domains table
CREATE TABLE IF NOT EXISTS public.organization_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  verification_token TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verifying','active','failed','removed')),
  verified_at TIMESTAMPTZ,
  ssl_provisioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_domains ENABLE ROW LEVEL SECURITY;

-- Org members can read their own domain
CREATE POLICY "Org members can view domain"
  ON public.organization_domains FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

-- Org admins can manage domain
CREATE POLICY "Org admins can manage domain"
  ON public.organization_domains FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Platform users can view all
CREATE POLICY "Platform users full access"
  ON public.organization_domains FOR ALL
  USING (public.is_platform_user(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_organization_domains_updated_at
  BEFORE UPDATE ON public.organization_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index
CREATE INDEX IF NOT EXISTS idx_organization_domains_org
  ON public.organization_domains(organization_id);
