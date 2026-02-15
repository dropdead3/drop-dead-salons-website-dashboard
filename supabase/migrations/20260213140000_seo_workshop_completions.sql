-- SEO Workshop: org-level checklist completions
CREATE TABLE IF NOT EXISTS public.seo_workshop_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  action_key TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  CONSTRAINT seo_workshop_completions_org_action_unique UNIQUE (organization_id, action_key)
);

-- Enable RLS
ALTER TABLE public.seo_workshop_completions ENABLE ROW LEVEL SECURITY;

-- RLS: org members can view
CREATE POLICY "Org members can view seo workshop completions"
  ON public.seo_workshop_completions FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

-- RLS: org members can insert (mark complete)
CREATE POLICY "Org members can insert seo workshop completions"
  ON public.seo_workshop_completions FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

-- RLS: org members can update (e.g. notes)
CREATE POLICY "Org members can update seo workshop completions"
  ON public.seo_workshop_completions FOR UPDATE
  USING (public.is_org_member(auth.uid(), organization_id))
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

-- RLS: org members can delete (uncomplete)
CREATE POLICY "Org members can delete seo workshop completions"
  ON public.seo_workshop_completions FOR DELETE
  USING (public.is_org_member(auth.uid(), organization_id));

-- Index for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_seo_workshop_completions_org
  ON public.seo_workshop_completions(organization_id);
