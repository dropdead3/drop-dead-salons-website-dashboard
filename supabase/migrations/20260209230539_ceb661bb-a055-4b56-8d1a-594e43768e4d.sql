
-- Create ai_business_insights table for caching AI-generated business insights
CREATE TABLE public.ai_business_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id TEXT,
  insights JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '2 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint for upsert behavior (one cached result per org+location)
CREATE UNIQUE INDEX idx_ai_business_insights_org_location 
  ON public.ai_business_insights (organization_id, COALESCE(location_id, '__all__'));

-- Enable RLS
ALTER TABLE public.ai_business_insights ENABLE ROW LEVEL SECURITY;

-- RLS: Authenticated org members can read their org's insights
CREATE POLICY "Org members can view insights"
  ON public.ai_business_insights
  FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

-- RLS: Allow insert/update from service role (edge function) - authenticated users with org membership
CREATE POLICY "Org members can insert insights"
  ON public.ai_business_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update insights"
  ON public.ai_business_insights
  FOR UPDATE
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
