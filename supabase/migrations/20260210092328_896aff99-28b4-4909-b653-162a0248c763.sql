
-- Create growth_forecasts table for caching long-range projections
CREATE TABLE public.growth_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id TEXT,
  forecast_type TEXT NOT NULL DEFAULT 'quarterly', -- 'quarterly' or 'annual'
  period_label TEXT NOT NULL, -- e.g. 'Q2 2026', '2026'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  scenario TEXT NOT NULL DEFAULT 'baseline', -- 'conservative', 'baseline', 'optimistic'
  projected_revenue NUMERIC NOT NULL DEFAULT 0,
  projected_service_revenue NUMERIC,
  projected_product_revenue NUMERIC,
  growth_rate_qoq NUMERIC, -- quarter-over-quarter %
  growth_rate_yoy NUMERIC, -- year-over-year %
  confidence_lower NUMERIC,
  confidence_upper NUMERIC,
  momentum TEXT, -- 'accelerating', 'steady', 'decelerating'
  seasonality_index NUMERIC, -- multiplier vs average
  insights JSONB, -- AI-generated insights
  actuals_revenue NUMERIC, -- filled in later for accuracy tracking
  accuracy_pct NUMERIC, -- filled in later
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_growth_forecasts_org ON public.growth_forecasts(organization_id);
CREATE INDEX idx_growth_forecasts_lookup ON public.growth_forecasts(organization_id, forecast_type, scenario, expires_at);

-- Enable RLS
ALTER TABLE public.growth_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS: org members can view their org's forecasts
CREATE POLICY "Org members can view growth forecasts"
ON public.growth_forecasts FOR SELECT
USING (public.is_org_member(auth.uid(), organization_id));

-- RLS: service role / edge functions can insert/update
CREATE POLICY "Service role can manage growth forecasts"
ON public.growth_forecasts FOR ALL
USING (true)
WITH CHECK (true);
