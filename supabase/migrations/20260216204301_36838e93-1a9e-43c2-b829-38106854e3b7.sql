
-- ─── service_location_prices ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.service_location_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (service_id, location_id)
);

ALTER TABLE public.service_location_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view location prices"
  ON public.service_location_prices FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can create location prices"
  ON public.service_location_prices FOR INSERT
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update location prices"
  ON public.service_location_prices FOR UPDATE
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete location prices"
  ON public.service_location_prices FOR DELETE
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE TRIGGER update_service_location_prices_updated_at
  BEFORE UPDATE ON public.service_location_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_service_location_prices_org
  ON public.service_location_prices(organization_id);

CREATE INDEX IF NOT EXISTS idx_service_location_prices_service
  ON public.service_location_prices(service_id);

-- ─── service_seasonal_adjustments ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.service_seasonal_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('percentage', 'fixed')),
  adjustment_value NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location_id TEXT REFERENCES public.locations(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_seasonal_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view seasonal adjustments"
  ON public.service_seasonal_adjustments FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can create seasonal adjustments"
  ON public.service_seasonal_adjustments FOR INSERT
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update seasonal adjustments"
  ON public.service_seasonal_adjustments FOR UPDATE
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete seasonal adjustments"
  ON public.service_seasonal_adjustments FOR DELETE
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE TRIGGER update_service_seasonal_adjustments_updated_at
  BEFORE UPDATE ON public.service_seasonal_adjustments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_service_seasonal_adjustments_org
  ON public.service_seasonal_adjustments(organization_id);

CREATE INDEX IF NOT EXISTS idx_service_seasonal_adjustments_service
  ON public.service_seasonal_adjustments(service_id);

CREATE INDEX IF NOT EXISTS idx_service_seasonal_adjustments_dates
  ON public.service_seasonal_adjustments(start_date, end_date);
