
-- Create ai_personal_insights table for per-user cached AI insights
CREATE TABLE public.ai_personal_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id),
  insights jsonb NOT NULL DEFAULT '{}'::jsonb,
  role_tier text NOT NULL DEFAULT 'stylist',
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '6 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX idx_ai_personal_insights_user_id ON public.ai_personal_insights(user_id);
CREATE INDEX idx_ai_personal_insights_expires_at ON public.ai_personal_insights(expires_at);

-- Enable RLS
ALTER TABLE public.ai_personal_insights ENABLE ROW LEVEL SECURITY;

-- Users can only see their own insights
CREATE POLICY "Users can view their own personal insights"
  ON public.ai_personal_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal insights"
  ON public.ai_personal_insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal insights"
  ON public.ai_personal_insights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal insights"
  ON public.ai_personal_insights FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
