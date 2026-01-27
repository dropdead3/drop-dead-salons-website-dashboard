-- form_templates table
CREATE TABLE public.form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  form_type TEXT DEFAULT 'custom' CHECK (form_type IN ('service_agreement', 'model_release', 'consultation', 'custom')),
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1.0',
  is_active BOOLEAN DEFAULT true,
  requires_witness BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- service_form_requirements junction table
CREATE TABLE public.service_form_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES phorest_services(id) ON DELETE CASCADE,
  form_template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true,
  signing_frequency TEXT DEFAULT 'once' CHECK (signing_frequency IN ('once', 'per_visit', 'annually')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_id, form_template_id)
);

-- client_form_signatures table
CREATE TABLE public.client_form_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  form_template_id UUID NOT NULL REFERENCES form_templates(id),
  form_version TEXT NOT NULL,
  signed_at TIMESTAMPTZ DEFAULT now(),
  typed_signature TEXT,
  ip_address TEXT,
  appointment_id UUID,
  collected_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_form_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_form_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_templates
CREATE POLICY "Anyone can read form templates"
  ON public.form_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert form templates"
  ON public.form_templates FOR INSERT TO authenticated
  WITH CHECK (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Admins can update form templates"
  ON public.form_templates FOR UPDATE TO authenticated
  USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Admins can delete form templates"
  ON public.form_templates FOR DELETE TO authenticated
  USING (public.is_coach_or_admin(auth.uid()));

-- RLS Policies for service_form_requirements
CREATE POLICY "Anyone can read service form requirements"
  ON public.service_form_requirements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert service form requirements"
  ON public.service_form_requirements FOR INSERT TO authenticated
  WITH CHECK (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Admins can update service form requirements"
  ON public.service_form_requirements FOR UPDATE TO authenticated
  USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Admins can delete service form requirements"
  ON public.service_form_requirements FOR DELETE TO authenticated
  USING (public.is_coach_or_admin(auth.uid()));

-- RLS Policies for client_form_signatures
CREATE POLICY "Authenticated users can read signatures"
  ON public.client_form_signatures FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert signatures"
  ON public.client_form_signatures FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can delete signatures"
  ON public.client_form_signatures FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employee_profiles
      WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Trigger for updated_at on form_templates
CREATE TRIGGER update_form_templates_updated_at
  BEFORE UPDATE ON public.form_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster signature lookups
CREATE INDEX idx_client_form_signatures_client_id ON public.client_form_signatures(client_id);
CREATE INDEX idx_client_form_signatures_form_template_id ON public.client_form_signatures(form_template_id);
CREATE INDEX idx_service_form_requirements_service_id ON public.service_form_requirements(service_id);