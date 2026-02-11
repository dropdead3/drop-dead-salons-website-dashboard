
-- ============================================
-- V1 Zura Intelligence Tables
-- ============================================

-- Table 1: kpi_definitions
CREATE TABLE public.kpi_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id TEXT,
  metric_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC NOT NULL,
  warning_threshold NUMERIC NOT NULL,
  critical_threshold NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT '%',
  cadence TEXT NOT NULL DEFAULT 'weekly',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, metric_key, location_id)
);

ALTER TABLE public.kpi_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read kpi_definitions"
  ON public.kpi_definitions FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can insert kpi_definitions"
  ON public.kpi_definitions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update kpi_definitions"
  ON public.kpi_definitions FOR UPDATE
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete kpi_definitions"
  ON public.kpi_definitions FOR DELETE
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE TRIGGER update_kpi_definitions_updated_at
  BEFORE UPDATE ON public.kpi_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table 2: kpi_readings
CREATE TABLE public.kpi_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id TEXT,
  kpi_definition_id UUID NOT NULL REFERENCES public.kpi_definitions(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  reading_date DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kpi_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read kpi_readings"
  ON public.kpi_readings FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can insert kpi_readings"
  ON public.kpi_readings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update kpi_readings"
  ON public.kpi_readings FOR UPDATE
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete kpi_readings"
  ON public.kpi_readings FOR DELETE
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE INDEX idx_kpi_readings_definition ON public.kpi_readings(kpi_definition_id, reading_date DESC);
CREATE INDEX idx_kpi_readings_org_date ON public.kpi_readings(organization_id, reading_date DESC);

-- Table 3: lever_recommendations
CREATE TABLE public.lever_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lever_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  what_to_do TEXT NOT NULL,
  why_now JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_monthly_impact NUMERIC,
  confidence TEXT NOT NULL DEFAULT 'medium',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  evidence JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  decision_notes TEXT,
  modified_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.lever_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can read lever_recommendations"
  ON public.lever_recommendations FOR SELECT
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can insert lever_recommendations"
  ON public.lever_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update lever_recommendations"
  ON public.lever_recommendations FOR UPDATE
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete lever_recommendations"
  ON public.lever_recommendations FOR DELETE
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE INDEX idx_lever_recommendations_org_active ON public.lever_recommendations(organization_id, is_active, created_at DESC);

-- Table 4: lever_outcomes
CREATE TABLE public.lever_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id UUID NOT NULL REFERENCES public.lever_recommendations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  value_before NUMERIC NOT NULL,
  value_after NUMERIC,
  delta NUMERIC,
  measured_at TIMESTAMPTZ,
  measurement_window TEXT NOT NULL DEFAULT '7d',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lever_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can read lever_outcomes"
  ON public.lever_outcomes FOR SELECT
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can insert lever_outcomes"
  ON public.lever_outcomes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update lever_outcomes"
  ON public.lever_outcomes FOR UPDATE
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE INDEX idx_lever_outcomes_recommendation ON public.lever_outcomes(recommendation_id);
