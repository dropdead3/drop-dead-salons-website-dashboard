
-- Create client_email_preferences table for marketing opt-out tracking
CREATE TABLE IF NOT EXISTS public.client_email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.phorest_clients(id) ON DELETE CASCADE,
  marketing_opt_out BOOLEAN NOT NULL DEFAULT false,
  opt_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, client_id)
);

-- Enable RLS (service role only - no browser policies)
ALTER TABLE public.client_email_preferences ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_client_email_prefs_org_client
  ON public.client_email_preferences(organization_id, client_id);
