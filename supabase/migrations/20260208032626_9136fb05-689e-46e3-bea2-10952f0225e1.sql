-- =============================================
-- PHASE 3: CLIENT ENGAGEMENT TOOLS
-- =============================================

-- 1. CLIENT FEEDBACK SYSTEM
-- =============================================

CREATE TABLE public.client_feedback_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  trigger_type TEXT DEFAULT 'post_appointment',
  delay_hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.client_feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  survey_id UUID REFERENCES public.client_feedback_surveys(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.phorest_clients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  staff_user_id UUID,
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  service_quality INTEGER CHECK (service_quality >= 1 AND service_quality <= 5),
  staff_friendliness INTEGER CHECK (staff_friendliness >= 1 AND staff_friendliness <= 5),
  cleanliness INTEGER CHECK (cleanliness >= 1 AND cleanliness <= 5),
  would_recommend BOOLEAN,
  comments TEXT,
  is_public BOOLEAN DEFAULT false,
  responded_at TIMESTAMPTZ,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.nps_daily_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_responses INTEGER DEFAULT 0,
  promoters INTEGER DEFAULT 0,
  passives INTEGER DEFAULT 0,
  detractors INTEGER DEFAULT 0,
  nps_score INTEGER,
  average_rating NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, snapshot_date)
);

-- 2. CLIENT PORTAL ACCESS
-- =============================================

CREATE TABLE public.client_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.phorest_clients(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RE-ENGAGEMENT SYSTEM
-- =============================================

CREATE TABLE public.reengagement_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  inactivity_days INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  email_template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  sms_enabled BOOLEAN DEFAULT false,
  offer_type TEXT,
  offer_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.reengagement_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.reengagement_campaigns(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.phorest_clients(id) ON DELETE CASCADE,
  last_visit_date TIMESTAMPTZ,
  days_inactive INTEGER,
  contacted_at TIMESTAMPTZ DEFAULT now(),
  channel TEXT DEFAULT 'email',
  status TEXT DEFAULT 'sent',
  converted_at TIMESTAMPTZ,
  converted_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, client_id)
);

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.client_feedback_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nps_daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reengagement_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reengagement_outreach ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Feedback Surveys
CREATE POLICY "Org members can view surveys"
  ON public.client_feedback_surveys FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage surveys"
  ON public.client_feedback_surveys FOR ALL
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Feedback Responses - allow public submission and viewing by token
CREATE POLICY "Anyone can submit feedback via token"
  ON public.client_feedback_responses FOR INSERT
  TO anon, authenticated
  WITH CHECK (token IS NOT NULL);

CREATE POLICY "Anyone can view feedback by token"
  ON public.client_feedback_responses FOR SELECT
  TO anon, authenticated
  USING (token IS NOT NULL);

CREATE POLICY "Org members can view all feedback"
  ON public.client_feedback_responses FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage feedback"
  ON public.client_feedback_responses FOR ALL
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

-- NPS Snapshots
CREATE POLICY "Org members can view NPS snapshots"
  ON public.nps_daily_snapshots FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage NPS snapshots"
  ON public.nps_daily_snapshots FOR ALL
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Portal Tokens
CREATE POLICY "Anyone can validate portal token"
  ON public.client_portal_tokens FOR SELECT
  TO anon, authenticated
  USING (token IS NOT NULL);

CREATE POLICY "Org admins can manage portal tokens"
  ON public.client_portal_tokens FOR ALL
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Re-engagement Campaigns
CREATE POLICY "Org members can view campaigns"
  ON public.reengagement_campaigns FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage campaigns"
  ON public.reengagement_campaigns FOR ALL
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Re-engagement Outreach
CREATE POLICY "Org members can view outreach"
  ON public.reengagement_outreach FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reengagement_campaigns c
      WHERE c.id = campaign_id
      AND public.is_org_member(auth.uid(), c.organization_id)
    )
  );

CREATE POLICY "Org admins can manage outreach"
  ON public.reengagement_outreach FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reengagement_campaigns c
      WHERE c.id = campaign_id
      AND public.is_org_admin(auth.uid(), c.organization_id)
    )
  );

-- =============================================
-- HELPER FUNCTION: Generate secure token using UUID
-- =============================================

CREATE OR REPLACE FUNCTION public.generate_secure_token()
RETURNS TEXT
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT replace(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), '-', '')
$$;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_feedback_responses_token ON public.client_feedback_responses(token);
CREATE INDEX idx_feedback_responses_org ON public.client_feedback_responses(organization_id);
CREATE INDEX idx_feedback_responses_client ON public.client_feedback_responses(client_id);
CREATE INDEX idx_portal_tokens_token ON public.client_portal_tokens(token);
CREATE INDEX idx_portal_tokens_client ON public.client_portal_tokens(client_id);
CREATE INDEX idx_reengagement_outreach_campaign ON public.reengagement_outreach(campaign_id);
CREATE INDEX idx_reengagement_outreach_client ON public.reengagement_outreach(client_id);
CREATE INDEX idx_nps_snapshots_date ON public.nps_daily_snapshots(organization_id, snapshot_date);