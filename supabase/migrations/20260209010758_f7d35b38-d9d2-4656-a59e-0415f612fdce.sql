-- Create organization POS configuration table
-- Tracks which POS system each organization uses and stores connection settings

CREATE TABLE IF NOT EXISTS public.organization_pos_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pos_type TEXT NOT NULL DEFAULT 'phorest',
  credentials_encrypted TEXT,
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Add constraint for valid POS types
ALTER TABLE public.organization_pos_config
ADD CONSTRAINT valid_pos_type CHECK (pos_type IN ('phorest', 'square', 'boulevard', 'zenoti', 'manual'));

-- Create index for organization lookups
CREATE INDEX idx_org_pos_config_org ON public.organization_pos_config(organization_id);

-- Enable RLS
ALTER TABLE public.organization_pos_config ENABLE ROW LEVEL SECURITY;

-- Platform admins can manage all POS configs
CREATE POLICY "Platform admins manage POS config"
ON public.organization_pos_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.platform_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('platform_owner', 'platform_admin')
  )
);

-- Organization admins can view their own config
CREATE POLICY "Org admins view own POS config"
ON public.organization_pos_config
FOR SELECT
USING (
  public.is_org_admin(auth.uid(), organization_id)
);

-- Create trigger for updated_at
CREATE TRIGGER update_org_pos_config_updated_at
BEFORE UPDATE ON public.organization_pos_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();