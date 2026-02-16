
-- =============================================
-- Service Communication Flows System
-- =============================================

-- 1. Service Email Flows (per service or category)
CREATE TABLE IF NOT EXISTS public.service_email_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  service_category TEXT,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one flow per service per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_email_flows_service
  ON public.service_email_flows(organization_id, service_id) WHERE service_id IS NOT NULL;

-- Only one category-level flow per category per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_email_flows_category
  ON public.service_email_flows(organization_id, service_category) WHERE service_category IS NOT NULL AND service_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_email_flows_org
  ON public.service_email_flows(organization_id);

ALTER TABLE public.service_email_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view service email flows"
  ON public.service_email_flows FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can create service email flows"
  ON public.service_email_flows FOR INSERT
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update service email flows"
  ON public.service_email_flows FOR UPDATE
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete service email flows"
  ON public.service_email_flows FOR DELETE
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE TRIGGER update_service_email_flows_updated_at
  BEFORE UPDATE ON public.service_email_flows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2. Service Email Flow Steps
CREATE TABLE IF NOT EXISTS public.service_email_flow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.service_email_flows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 1,
  timing_type TEXT NOT NULL DEFAULT 'before_appointment',
  timing_value INTEGER NOT NULL DEFAULT 24,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL DEFAULT '',
  email_template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_email_flow_steps_flow
  ON public.service_email_flow_steps(flow_id, step_order);

ALTER TABLE public.service_email_flow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view flow steps"
  ON public.service_email_flow_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.service_email_flows f
    WHERE f.id = flow_id
    AND public.is_org_member(auth.uid(), f.organization_id)
  ));

CREATE POLICY "Org admins can create flow steps"
  ON public.service_email_flow_steps FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.service_email_flows f
    WHERE f.id = flow_id
    AND public.is_org_admin(auth.uid(), f.organization_id)
  ));

CREATE POLICY "Org admins can update flow steps"
  ON public.service_email_flow_steps FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.service_email_flows f
    WHERE f.id = flow_id
    AND public.is_org_admin(auth.uid(), f.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.service_email_flows f
    WHERE f.id = flow_id
    AND public.is_org_admin(auth.uid(), f.organization_id)
  ));

CREATE POLICY "Org admins can delete flow steps"
  ON public.service_email_flow_steps FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.service_email_flows f
    WHERE f.id = flow_id
    AND public.is_org_admin(auth.uid(), f.organization_id)
  ));

CREATE TRIGGER update_service_email_flow_steps_updated_at
  BEFORE UPDATE ON public.service_email_flow_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 3. Service Email Flow Step Overrides (location-specific)
CREATE TABLE IF NOT EXISTS public.service_email_flow_step_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.service_email_flow_steps(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  subject TEXT,
  html_body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(step_id, location_id)
);

ALTER TABLE public.service_email_flow_step_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view step overrides"
  ON public.service_email_flow_step_overrides FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.service_email_flow_steps s
    JOIN public.service_email_flows f ON f.id = s.flow_id
    WHERE s.id = step_id
    AND public.is_org_member(auth.uid(), f.organization_id)
  ));

CREATE POLICY "Org admins can manage step overrides"
  ON public.service_email_flow_step_overrides FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.service_email_flow_steps s
    JOIN public.service_email_flows f ON f.id = s.flow_id
    WHERE s.id = step_id
    AND public.is_org_admin(auth.uid(), f.organization_id)
  ));

CREATE POLICY "Org admins can update step overrides"
  ON public.service_email_flow_step_overrides FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.service_email_flow_steps s
    JOIN public.service_email_flows f ON f.id = s.flow_id
    WHERE s.id = step_id
    AND public.is_org_admin(auth.uid(), f.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.service_email_flow_steps s
    JOIN public.service_email_flows f ON f.id = s.flow_id
    WHERE s.id = step_id
    AND public.is_org_admin(auth.uid(), f.organization_id)
  ));

CREATE POLICY "Org admins can delete step overrides"
  ON public.service_email_flow_step_overrides FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.service_email_flow_steps s
    JOIN public.service_email_flows f ON f.id = s.flow_id
    WHERE s.id = step_id
    AND public.is_org_admin(auth.uid(), f.organization_id)
  ));


-- 4. Service Email Queue
CREATE TABLE IF NOT EXISTS public.service_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.phorest_clients(id) ON DELETE SET NULL,
  step_id UUID NOT NULL REFERENCES public.service_email_flow_steps(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  merged_into_id UUID REFERENCES public.service_email_queue(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_email_queue_pending
  ON public.service_email_queue(organization_id, status, scheduled_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_service_email_queue_client
  ON public.service_email_queue(client_id, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_service_email_queue_appointment
  ON public.service_email_queue(appointment_id);

ALTER TABLE public.service_email_queue ENABLE ROW LEVEL SECURITY;

-- Service role only access (edge functions use service role)
CREATE POLICY "Service role manages email queue"
  ON public.service_email_queue FOR ALL
  USING (false)
  WITH CHECK (false);

-- Org admins can view queue for monitoring
CREATE POLICY "Org admins can view email queue"
  ON public.service_email_queue FOR SELECT
  USING (public.is_org_admin(auth.uid(), organization_id));


-- 5. Appointment Reminders Config
CREATE TABLE IF NOT EXISTS public.appointment_reminders_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  subject TEXT NOT NULL DEFAULT '',
  html_body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, reminder_type)
);

ALTER TABLE public.appointment_reminders_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view reminder config"
  ON public.appointment_reminders_config FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can create reminder config"
  ON public.appointment_reminders_config FOR INSERT
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update reminder config"
  ON public.appointment_reminders_config FOR UPDATE
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete reminder config"
  ON public.appointment_reminders_config FOR DELETE
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE TRIGGER update_appointment_reminders_config_updated_at
  BEFORE UPDATE ON public.appointment_reminders_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 6. Appointment Reminder Overrides (location-specific)
CREATE TABLE IF NOT EXISTS public.appointment_reminder_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.appointment_reminders_config(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  subject TEXT,
  html_body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(config_id, location_id)
);

ALTER TABLE public.appointment_reminder_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view reminder overrides"
  ON public.appointment_reminder_overrides FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.appointment_reminders_config c
    WHERE c.id = config_id
    AND public.is_org_member(auth.uid(), c.organization_id)
  ));

CREATE POLICY "Org admins can manage reminder overrides"
  ON public.appointment_reminder_overrides FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.appointment_reminders_config c
    WHERE c.id = config_id
    AND public.is_org_admin(auth.uid(), c.organization_id)
  ));

CREATE POLICY "Org admins can update reminder overrides"
  ON public.appointment_reminder_overrides FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.appointment_reminders_config c
    WHERE c.id = config_id
    AND public.is_org_admin(auth.uid(), c.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.appointment_reminders_config c
    WHERE c.id = config_id
    AND public.is_org_admin(auth.uid(), c.organization_id)
  ));

CREATE POLICY "Org admins can delete reminder overrides"
  ON public.appointment_reminder_overrides FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.appointment_reminders_config c
    WHERE c.id = config_id
    AND public.is_org_admin(auth.uid(), c.organization_id)
  ));


-- Add a column to appointments to track reminder state
ALTER TABLE public.appointments 
  ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_2h_sent BOOLEAN DEFAULT false;
