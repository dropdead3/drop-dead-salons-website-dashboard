-- =====================================================
-- AI & AUTOMATION ENHANCEMENT TABLES
-- =====================================================

-- 1. SCHEDULING SUGGESTIONS - Store AI scheduling recommendations
CREATE TABLE public.scheduling_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  staff_user_id UUID NOT NULL,
  suggested_date DATE NOT NULL,
  suggested_time TIME NOT NULL,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('optimal_slot', 'fill_gap', 'avoid_conflict', 'peak_time')),
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  context JSONB DEFAULT '{}',
  was_accepted BOOLEAN,
  service_duration_minutes INTEGER,
  location_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. BOOKING PATTERNS - Track historical booking patterns for ML
CREATE TABLE public.booking_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id TEXT,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  hour_of_day INTEGER CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  avg_bookings NUMERIC,
  peak_score NUMERIC(3,2),
  total_samples INTEGER DEFAULT 0,
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, location_id, day_of_week, hour_of_day)
);

-- 3. REVENUE FORECASTS - Store AI revenue predictions
CREATE TABLE public.revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id TEXT,
  forecast_date DATE NOT NULL,
  forecast_type TEXT NOT NULL CHECK (forecast_type IN ('daily', 'weekly', 'monthly')),
  predicted_revenue NUMERIC NOT NULL,
  predicted_services NUMERIC,
  predicted_products NUMERIC,
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  factors JSONB DEFAULT '[]',
  actual_revenue NUMERIC,
  accuracy_score NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, location_id, forecast_date, forecast_type)
);

-- 4. CLIENT AUTOMATION RULES - Define automated client communication rules
CREATE TABLE public.client_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('post_visit_thanks', 'rebooking_reminder', 'win_back', 'birthday', 'custom')),
  trigger_days INTEGER NOT NULL,
  email_template_id UUID,
  sms_template_id UUID,
  is_active BOOLEAN DEFAULT true,
  conditions JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CLIENT AUTOMATION LOG - Track automation execution
CREATE TABLE public.client_automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.client_automation_rules(id) ON DELETE SET NULL,
  client_id UUID,
  phorest_client_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  channel TEXT CHECK (channel IN ('email', 'sms', 'push')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'opened', 'clicked', 'bounced')),
  metadata JSONB DEFAULT '{}',
  error_message TEXT
);

-- 6. DETECTED ANOMALIES - Store detected anomalies for alerting
CREATE TABLE public.detected_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id TEXT,
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('revenue_drop', 'cancellation_spike', 'no_show_surge', 'booking_drop', 'revenue_spike', 'unusual_activity')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  detected_at TIMESTAMPTZ DEFAULT now(),
  metric_value NUMERIC,
  expected_value NUMERIC,
  deviation_percent NUMERIC,
  context JSONB DEFAULT '{}',
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.scheduling_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_automation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_anomalies ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - Organization-scoped access
-- =====================================================

-- Scheduling Suggestions policies
CREATE POLICY "Users can view their org scheduling suggestions"
ON public.scheduling_suggestions FOR SELECT
TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can insert scheduling suggestions for their org"
ON public.scheduling_suggestions FOR INSERT
TO authenticated
WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can update their org scheduling suggestions"
ON public.scheduling_suggestions FOR UPDATE
TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

-- Booking Patterns policies
CREATE POLICY "Users can view their org booking patterns"
ON public.booking_patterns FOR SELECT
TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage booking patterns"
ON public.booking_patterns FOR ALL
TO authenticated
USING (public.is_org_admin(auth.uid(), organization_id));

-- Revenue Forecasts policies
CREATE POLICY "Users can view their org revenue forecasts"
ON public.revenue_forecasts FOR SELECT
TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "System can manage revenue forecasts"
ON public.revenue_forecasts FOR ALL
TO authenticated
USING (public.is_org_admin(auth.uid(), organization_id));

-- Client Automation Rules policies
CREATE POLICY "Users can view their org automation rules"
ON public.client_automation_rules FOR SELECT
TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage automation rules"
ON public.client_automation_rules FOR ALL
TO authenticated
USING (public.is_org_admin(auth.uid(), organization_id));

-- Client Automation Log policies
CREATE POLICY "Users can view their org automation logs"
ON public.client_automation_log FOR SELECT
TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "System can insert automation logs"
ON public.client_automation_log FOR INSERT
TO authenticated
WITH CHECK (public.is_org_member(auth.uid(), organization_id));

-- Detected Anomalies policies
CREATE POLICY "Users can view their org anomalies"
ON public.detected_anomalies FOR SELECT
TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can acknowledge anomalies"
ON public.detected_anomalies FOR UPDATE
TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "System can insert anomalies"
ON public.detected_anomalies FOR INSERT
TO authenticated
WITH CHECK (public.is_org_member(auth.uid(), organization_id));

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_scheduling_suggestions_org_date ON public.scheduling_suggestions(organization_id, suggested_date);
CREATE INDEX idx_scheduling_suggestions_staff ON public.scheduling_suggestions(staff_user_id, suggested_date);
CREATE INDEX idx_booking_patterns_org_location ON public.booking_patterns(organization_id, location_id);
CREATE INDEX idx_revenue_forecasts_org_date ON public.revenue_forecasts(organization_id, forecast_date);
CREATE INDEX idx_client_automation_rules_org_active ON public.client_automation_rules(organization_id, is_active);
CREATE INDEX idx_client_automation_log_org_sent ON public.client_automation_log(organization_id, sent_at);
CREATE INDEX idx_detected_anomalies_org_unacked ON public.detected_anomalies(organization_id, is_acknowledged) WHERE is_acknowledged = false;

-- =====================================================
-- TRIGGER FOR UPDATED_AT
-- =====================================================
CREATE TRIGGER update_client_automation_rules_updated_at
  BEFORE UPDATE ON public.client_automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();