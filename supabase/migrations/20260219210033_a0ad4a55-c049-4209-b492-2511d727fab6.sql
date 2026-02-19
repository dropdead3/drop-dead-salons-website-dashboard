
-- Create junction table for assistant stylists on appointments
CREATE TABLE IF NOT EXISTS public.appointment_assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.phorest_appointments(id) ON DELETE CASCADE,
  assistant_user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(appointment_id, assistant_user_id)
);

-- Enable RLS
ALTER TABLE public.appointment_assistants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org members can view appointment assistants"
  ON public.appointment_assistants FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can assign assistants"
  ON public.appointment_assistants FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can remove assistants"
  ON public.appointment_assistants FOR DELETE
  USING (public.is_org_member(auth.uid(), organization_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointment_assistants_appointment
  ON public.appointment_assistants(appointment_id);

CREATE INDEX IF NOT EXISTS idx_appointment_assistants_user
  ON public.appointment_assistants(assistant_user_id);

CREATE INDEX IF NOT EXISTS idx_appointment_assistants_org
  ON public.appointment_assistants(organization_id);
