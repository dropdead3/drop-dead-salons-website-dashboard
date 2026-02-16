
-- Email tracking: open and click events per service email queue item
CREATE TABLE IF NOT EXISTS public.email_tracking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_item_id UUID REFERENCES public.service_email_queue(id) ON DELETE SET NULL,
  message_id TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('open', 'click')),
  link_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view email tracking"
  ON public.email_tracking_events FOR SELECT
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE INDEX idx_email_tracking_queue ON public.email_tracking_events(queue_item_id);
CREATE INDEX idx_email_tracking_org ON public.email_tracking_events(organization_id, created_at DESC);

-- SMS templates: add Twilio-related columns if not exist (sms_templates already exists based on sms-sender.ts)
-- Add Twilio config to organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS twilio_account_sid TEXT,
  ADD COLUMN IF NOT EXISTS twilio_auth_token TEXT,
  ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT;
