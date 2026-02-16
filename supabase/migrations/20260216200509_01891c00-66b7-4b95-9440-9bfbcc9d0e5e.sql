
-- Add organization_id to service_category_colors
ALTER TABLE public.service_category_colors
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Backfill with default organization (drop-dead-salons)
UPDATE public.service_category_colors
SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'drop-dead-salons' LIMIT 1)
WHERE organization_id IS NULL;

-- Drop existing RLS policies to recreate with org scoping
DROP POLICY IF EXISTS "Authenticated users can view service colors" ON public.service_category_colors;
DROP POLICY IF EXISTS "Admins can manage service colors" ON public.service_category_colors;

-- New RLS policies with org scoping
CREATE POLICY "Authenticated users can view service colors"
  ON public.service_category_colors FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Org admins can manage service colors"
  ON public.service_category_colors FOR ALL
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));
