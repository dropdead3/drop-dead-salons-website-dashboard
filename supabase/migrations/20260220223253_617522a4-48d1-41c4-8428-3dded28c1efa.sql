
-- Create service_category_addons table
CREATE TABLE IF NOT EXISTS public.service_category_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_category_id UUID NOT NULL REFERENCES public.service_category_colors(id) ON DELETE CASCADE,
  addon_label TEXT NOT NULL,
  addon_category_name TEXT,
  addon_service_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_category_addons ENABLE ROW LEVEL SECURITY;

-- Org members can read add-ons
CREATE POLICY "Org members can view service_category_addons"
  ON public.service_category_addons FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

-- Org admins can insert
CREATE POLICY "Org admins can create service_category_addons"
  ON public.service_category_addons FOR INSERT
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

-- Org admins can update
CREATE POLICY "Org admins can update service_category_addons"
  ON public.service_category_addons FOR UPDATE
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

-- Org admins can delete
CREATE POLICY "Org admins can delete service_category_addons"
  ON public.service_category_addons FOR DELETE
  USING (public.is_org_admin(auth.uid(), organization_id));

-- updated_at trigger
CREATE TRIGGER update_service_category_addons_updated_at
  BEFORE UPDATE ON public.service_category_addons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_service_category_addons_source
  ON public.service_category_addons(source_category_id);

CREATE INDEX IF NOT EXISTS idx_service_category_addons_org
  ON public.service_category_addons(organization_id);
