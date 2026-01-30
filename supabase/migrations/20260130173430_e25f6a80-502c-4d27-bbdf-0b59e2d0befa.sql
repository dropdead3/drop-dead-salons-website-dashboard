-- Create pandadoc_documents table to track PandaDoc documents linked to organizations
CREATE TABLE public.pandadoc_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pandadoc_document_id TEXT NOT NULL UNIQUE,
  document_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'completed', 'voided', 'declined')),
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  signed_by_name TEXT,
  signed_by_email TEXT,
  extracted_fields JSONB DEFAULT '{}',
  applied_to_billing BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contract_adjustments table for audit trail of manual contract changes
CREATE TABLE public.contract_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('term_extension', 'comp_months', 'date_change', 'custom')),
  description TEXT NOT NULL,
  previous_start_date DATE,
  new_start_date DATE,
  previous_end_date DATE,
  new_end_date DATE,
  months_added INTEGER,
  comp_value NUMERIC(10,2),
  reason TEXT NOT NULL,
  approved_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX idx_pandadoc_documents_organization ON public.pandadoc_documents(organization_id);
CREATE INDEX idx_pandadoc_documents_status ON public.pandadoc_documents(status);
CREATE INDEX idx_contract_adjustments_organization ON public.contract_adjustments(organization_id);
CREATE INDEX idx_contract_adjustments_type ON public.contract_adjustments(adjustment_type);

-- Enable RLS
ALTER TABLE public.pandadoc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS policies for pandadoc_documents - platform users can manage
CREATE POLICY "Platform users can view pandadoc documents"
  ON public.pandadoc_documents
  FOR SELECT
  USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform users can insert pandadoc documents"
  ON public.pandadoc_documents
  FOR INSERT
  WITH CHECK (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform users can update pandadoc documents"
  ON public.pandadoc_documents
  FOR UPDATE
  USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Service role can manage pandadoc documents"
  ON public.pandadoc_documents
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS policies for contract_adjustments - platform users can view, admins/owners can insert
CREATE POLICY "Platform users can view contract adjustments"
  ON public.contract_adjustments
  FOR SELECT
  USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform admins can insert contract adjustments"
  ON public.contract_adjustments
  FOR INSERT
  WITH CHECK (
    public.has_platform_role(auth.uid(), 'platform_admin') OR
    public.has_platform_role(auth.uid(), 'platform_owner')
  );

-- Create updated_at trigger for pandadoc_documents
CREATE TRIGGER update_pandadoc_documents_updated_at
  BEFORE UPDATE ON public.pandadoc_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add pandadoc field mapping to site_settings
INSERT INTO public.site_settings (id, value)
VALUES ('pandadoc_field_mapping', '{
  "term_start_date": "contract_start_date",
  "term_end_date": "contract_end_date",
  "subscription_plan": "plan_name_lookup",
  "monthly_rate": "custom_price",
  "promo_months": "promo_months",
  "promo_rate": "promo_price",
  "setup_fee": "setup_fee",
  "special_notes": "notes"
}'::jsonb)
ON CONFLICT (id) DO NOTHING;