
CREATE TABLE public.dismissed_insight_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  suggestion_key text NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_dismissed_suggestions_unique ON public.dismissed_insight_suggestions (organization_id, user_id, suggestion_key);
CREATE INDEX idx_dismissed_suggestions_expires ON public.dismissed_insight_suggestions (expires_at);

ALTER TABLE public.dismissed_insight_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own dismissals"
ON public.dismissed_insight_suggestions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dismissals"
ON public.dismissed_insight_suggestions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dismissals"
ON public.dismissed_insight_suggestions FOR DELETE
USING (auth.uid() = user_id);
