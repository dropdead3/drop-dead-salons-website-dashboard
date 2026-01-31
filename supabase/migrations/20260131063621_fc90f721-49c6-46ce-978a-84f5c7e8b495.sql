-- Add organization_id to import_jobs for direct filtering
ALTER TABLE public.import_jobs 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_import_jobs_organization 
ON public.import_jobs(organization_id);

-- Platform security settings table
CREATE TABLE IF NOT EXISTS public.platform_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_password_length INTEGER NOT NULL DEFAULT 12,
  require_special_chars BOOLEAN NOT NULL DEFAULT true,
  require_mixed_case BOOLEAN NOT NULL DEFAULT true,
  password_expiry_days INTEGER NOT NULL DEFAULT 90,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 30,
  max_concurrent_sessions INTEGER NOT NULL DEFAULT 3,
  require_2fa_platform_admins BOOLEAN NOT NULL DEFAULT true,
  require_2fa_org_admins BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on platform_security_settings
ALTER TABLE public.platform_security_settings ENABLE ROW LEVEL SECURITY;

-- RLS policy: Only platform admins can view security settings
CREATE POLICY "Platform users can view security settings"
ON public.platform_security_settings
FOR SELECT
TO authenticated
USING (public.is_platform_user(auth.uid()));

-- RLS policy: Only platform owners can update security settings  
CREATE POLICY "Platform owners can update security settings"
ON public.platform_security_settings
FOR UPDATE
TO authenticated
USING (public.has_platform_role(auth.uid(), 'platform_owner'))
WITH CHECK (public.has_platform_role(auth.uid(), 'platform_owner'));

-- RLS policy: Allow platform owners to insert (for initial setup)
CREATE POLICY "Platform owners can insert security settings"
ON public.platform_security_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_platform_role(auth.uid(), 'platform_owner'));

-- Insert default security settings row if none exists
INSERT INTO public.platform_security_settings (id) 
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_platform_security_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_platform_security_settings_timestamp
BEFORE UPDATE ON public.platform_security_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_platform_security_settings_updated_at();