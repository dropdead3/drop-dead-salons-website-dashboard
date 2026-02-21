
-- Create commission rate history audit trail table
CREATE TABLE public.commission_rate_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID,
  change_type TEXT NOT NULL,
  previous_service_rate NUMERIC,
  new_service_rate NUMERIC,
  previous_retail_rate NUMERIC,
  new_retail_rate NUMERIC,
  changed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_rate_history ENABLE ROW LEVEL SECURITY;

-- Org members can view
CREATE POLICY "Org members can view commission history"
  ON public.commission_rate_history
  FOR SELECT
  USING (
    public.is_org_member(auth.uid(), organization_id)
  );

-- Org admins can insert
CREATE POLICY "Org admins can insert commission history"
  ON public.commission_rate_history
  FOR INSERT
  WITH CHECK (
    public.is_org_admin(auth.uid(), organization_id)
  );

-- Index for lookups
CREATE INDEX idx_commission_rate_history_org ON public.commission_rate_history(organization_id);
CREATE INDEX idx_commission_rate_history_user ON public.commission_rate_history(user_id);
