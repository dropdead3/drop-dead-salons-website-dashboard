
-- service_level_prices: default price per service per stylist level
CREATE TABLE IF NOT EXISTS public.service_level_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  stylist_level_id UUID NOT NULL REFERENCES public.stylist_levels(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (service_id, stylist_level_id)
);

ALTER TABLE public.service_level_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view service level prices"
  ON public.service_level_prices FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can create service level prices"
  ON public.service_level_prices FOR INSERT
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update service level prices"
  ON public.service_level_prices FOR UPDATE
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete service level prices"
  ON public.service_level_prices FOR DELETE
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE TRIGGER update_service_level_prices_updated_at
  BEFORE UPDATE ON public.service_level_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_service_level_prices_service ON public.service_level_prices(service_id);
CREATE INDEX IF NOT EXISTS idx_service_level_prices_org ON public.service_level_prices(organization_id);

-- service_stylist_price_overrides: per-stylist price overrides
CREATE TABLE IF NOT EXISTS public.service_stylist_price_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (service_id, employee_id)
);

ALTER TABLE public.service_stylist_price_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view stylist price overrides"
  ON public.service_stylist_price_overrides FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can create stylist price overrides"
  ON public.service_stylist_price_overrides FOR INSERT
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update stylist price overrides"
  ON public.service_stylist_price_overrides FOR UPDATE
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete stylist price overrides"
  ON public.service_stylist_price_overrides FOR DELETE
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE TRIGGER update_service_stylist_price_overrides_updated_at
  BEFORE UPDATE ON public.service_stylist_price_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_service_stylist_overrides_service ON public.service_stylist_price_overrides(service_id);
CREATE INDEX IF NOT EXISTS idx_service_stylist_overrides_employee ON public.service_stylist_price_overrides(employee_id);
CREATE INDEX IF NOT EXISTS idx_service_stylist_overrides_org ON public.service_stylist_price_overrides(organization_id);
