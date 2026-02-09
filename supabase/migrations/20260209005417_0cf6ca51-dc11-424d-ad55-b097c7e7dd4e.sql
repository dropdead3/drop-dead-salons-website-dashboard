-- Organization Health Scores table for tracking tenant health over time
CREATE TABLE public.organization_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('healthy', 'at_risk', 'critical')),
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  trends JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  score_date DATE NOT NULL DEFAULT CURRENT_DATE,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index on org + date to ensure one score per org per day
CREATE UNIQUE INDEX idx_health_scores_org_date ON public.organization_health_scores(organization_id, score_date);
CREATE INDEX idx_health_scores_org ON public.organization_health_scores(organization_id, calculated_at DESC);
CREATE INDEX idx_health_scores_risk ON public.organization_health_scores(risk_level, score_date DESC);
CREATE INDEX idx_health_scores_date ON public.organization_health_scores(score_date DESC);

ALTER TABLE public.organization_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins view health scores" ON public.organization_health_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.platform_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('platform_owner', 'platform_admin', 'platform_support')
    )
  );

CREATE POLICY "System can insert health scores" ON public.organization_health_scores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update health scores" ON public.organization_health_scores
  FOR UPDATE USING (true);

-- Organization Benchmarks table for cross-org comparisons
CREATE TABLE public.organization_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  metric_key TEXT NOT NULL,
  value NUMERIC NOT NULL,
  percentile INTEGER CHECK (percentile >= 0 AND percentile <= 100),
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  comparison_group TEXT NOT NULL DEFAULT 'all',
  metadata JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_benchmarks_unique ON public.organization_benchmarks(organization_id, metric_key, period_start, comparison_group);
CREATE INDEX idx_benchmarks_org ON public.organization_benchmarks(organization_id, metric_key, period_start DESC);
CREATE INDEX idx_benchmarks_metric ON public.organization_benchmarks(metric_key, period_start DESC);
CREATE INDEX idx_benchmarks_percentile ON public.organization_benchmarks(metric_key, percentile DESC);

ALTER TABLE public.organization_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins view benchmarks" ON public.organization_benchmarks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.platform_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('platform_owner', 'platform_admin')
    )
  );

CREATE POLICY "System can insert benchmarks" ON public.organization_benchmarks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update benchmarks" ON public.organization_benchmarks
  FOR UPDATE USING (true);

-- Enable realtime for health scores to push updates to dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_health_scores;