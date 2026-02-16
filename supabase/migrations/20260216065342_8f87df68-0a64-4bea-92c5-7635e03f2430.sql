
-- Gap 4: Add physical address field to organizations for CAN-SPAM compliance
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS email_physical_address TEXT;

-- Gap 5: Create email_send_log table for audit trail
CREATE TABLE public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  client_id UUID,
  email_type TEXT NOT NULL DEFAULT 'marketing',
  message_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for rate limiting lookups (Gap 6)
CREATE INDEX idx_email_send_log_lookup ON public.email_send_log (organization_id, client_id, sent_at DESC);

-- RLS: service-role only access
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;
-- No browser-facing policies — only service role can read/write
