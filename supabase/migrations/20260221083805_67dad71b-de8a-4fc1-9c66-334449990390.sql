
-- Add commission rate columns to stylist_levels
ALTER TABLE public.stylist_levels
  ADD COLUMN IF NOT EXISTS service_commission_rate NUMERIC NULL,
  ADD COLUMN IF NOT EXISTS retail_commission_rate NUMERIC NULL;

-- Create stylist_commission_overrides table
CREATE TABLE IF NOT EXISTS public.stylist_commission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  service_commission_rate NUMERIC NULL,
  retail_commission_rate NUMERIC NULL,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one active override per stylist per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_stylist_commission_overrides_org_user
  ON public.stylist_commission_overrides(organization_id, user_id);

-- Enable RLS
ALTER TABLE public.stylist_commission_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org members can view commission overrides"
  ON public.stylist_commission_overrides FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can create commission overrides"
  ON public.stylist_commission_overrides FOR INSERT
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update commission overrides"
  ON public.stylist_commission_overrides FOR UPDATE
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete commission overrides"
  ON public.stylist_commission_overrides FOR DELETE
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Updated_at trigger
CREATE TRIGGER update_stylist_commission_overrides_updated_at
  BEFORE UPDATE ON public.stylist_commission_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index on org
CREATE INDEX IF NOT EXISTS idx_stylist_commission_overrides_org
  ON public.stylist_commission_overrides(organization_id);
