
-- ============================================================
-- Table 1: service_addons (the add-on library)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  cost NUMERIC,
  duration_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view service addons"
  ON public.service_addons FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can create service addons"
  ON public.service_addons FOR INSERT
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update service addons"
  ON public.service_addons FOR UPDATE
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete service addons"
  ON public.service_addons FOR DELETE
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE INDEX IF NOT EXISTS idx_service_addons_org ON public.service_addons(organization_id);

CREATE TRIGGER update_service_addons_updated_at
  BEFORE UPDATE ON public.service_addons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Table 2: service_addon_assignments (linking addons to categories/services)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_addon_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES public.service_addons(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('category', 'service')),
  target_category_id UUID REFERENCES public.service_category_colors(id) ON DELETE CASCADE,
  target_service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_addon_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view addon assignments"
  ON public.service_addon_assignments FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can create addon assignments"
  ON public.service_addon_assignments FOR INSERT
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete addon assignments"
  ON public.service_addon_assignments FOR DELETE
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE INDEX IF NOT EXISTS idx_addon_assignments_org ON public.service_addon_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_addon_assignments_addon ON public.service_addon_assignments(addon_id);
CREATE INDEX IF NOT EXISTS idx_addon_assignments_category ON public.service_addon_assignments(target_category_id) WHERE target_type = 'category';
CREATE INDEX IF NOT EXISTS idx_addon_assignments_service ON public.service_addon_assignments(target_service_id) WHERE target_type = 'service';

-- Unique constraint to prevent duplicate assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_addon_assignments_unique
  ON public.service_addon_assignments(addon_id, target_type, COALESCE(target_category_id, '00000000-0000-0000-0000-000000000000'), COALESCE(target_service_id, '00000000-0000-0000-0000-000000000000'));
