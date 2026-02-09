
-- =============================================
-- HR Tools Suite: All 6 tables + RLS policies
-- =============================================

-- 1. staff_documents
CREATE TABLE public.staff_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'other',
  document_name TEXT NOT NULL,
  license_number TEXT,
  issued_date DATE,
  expiration_date DATE,
  status TEXT NOT NULL DEFAULT 'valid',
  file_url TEXT,
  notes TEXT,
  reminded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
  ON public.staff_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all org documents"
  ON public.staff_documents FOR SELECT
  USING (public.is_coach_or_admin(auth.uid()) AND public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can insert their own documents"
  ON public.staff_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can update their own documents"
  ON public.staff_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can update org documents"
  ON public.staff_documents FOR UPDATE
  USING (public.is_coach_or_admin(auth.uid()) AND public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Managers can delete org documents"
  ON public.staff_documents FOR DELETE
  USING (public.is_coach_or_admin(auth.uid()) AND public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can delete their own documents"
  ON public.staff_documents FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_staff_documents_updated_at
  BEFORE UPDATE ON public.staff_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. performance_reviews
CREATE TABLE public.performance_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  review_type TEXT NOT NULL DEFAULT 'annual',
  review_period_start DATE,
  review_period_end DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  strengths TEXT,
  areas_for_improvement TEXT,
  goals_summary TEXT,
  reviewer_notes TEXT,
  employee_notes TEXT,
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviewers can manage their draft reviews"
  ON public.performance_reviews FOR ALL
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Employees can view their own reviews"
  ON public.performance_reviews FOR SELECT
  USING (auth.uid() = user_id AND status IN ('submitted', 'acknowledged'));

CREATE POLICY "Employees can update to acknowledge"
  ON public.performance_reviews FOR UPDATE
  USING (auth.uid() = user_id AND status = 'submitted');

CREATE POLICY "Managers can view all org reviews"
  ON public.performance_reviews FOR SELECT
  USING (public.is_coach_or_admin(auth.uid()) AND public.is_org_member(auth.uid(), organization_id));

CREATE TRIGGER update_performance_reviews_updated_at
  BEFORE UPDATE ON public.performance_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. review_goals
CREATE TABLE public.review_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.performance_reviews(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  progress_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.review_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review goals inherit review access for select"
  ON public.review_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.performance_reviews pr
      WHERE pr.id = review_id
      AND (pr.reviewer_id = auth.uid() OR pr.user_id = auth.uid()
        OR (public.is_coach_or_admin(auth.uid()) AND public.is_org_member(auth.uid(), pr.organization_id)))
    )
  );

CREATE POLICY "Reviewers can manage review goals"
  ON public.review_goals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.performance_reviews pr
      WHERE pr.id = review_id AND pr.reviewer_id = auth.uid()
    )
  );

CREATE TRIGGER update_review_goals_updated_at
  BEFORE UPDATE ON public.review_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. pto_policies
CREATE TABLE public.pto_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  accrual_rate NUMERIC NOT NULL DEFAULT 0,
  accrual_period TEXT NOT NULL DEFAULT 'monthly',
  max_balance NUMERIC,
  carry_over_limit NUMERIC,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pto_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view policies"
  ON public.pto_policies FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage policies"
  ON public.pto_policies FOR ALL
  USING (public.is_coach_or_admin(auth.uid()) AND public.is_org_member(auth.uid(), organization_id));

CREATE TRIGGER update_pto_policies_updated_at
  BEFORE UPDATE ON public.pto_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. employee_pto_balances
CREATE TABLE public.employee_pto_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  policy_id UUID NOT NULL REFERENCES public.pto_policies(id) ON DELETE CASCADE,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  accrued_ytd NUMERIC NOT NULL DEFAULT 0,
  used_ytd NUMERIC NOT NULL DEFAULT 0,
  carried_over NUMERIC NOT NULL DEFAULT 0,
  last_accrual_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, policy_id)
);

ALTER TABLE public.employee_pto_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own PTO balances"
  ON public.employee_pto_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all org PTO balances"
  ON public.employee_pto_balances FOR SELECT
  USING (public.is_coach_or_admin(auth.uid()) AND public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Managers can manage org PTO balances"
  ON public.employee_pto_balances FOR ALL
  USING (public.is_coach_or_admin(auth.uid()) AND public.is_org_member(auth.uid(), organization_id));

CREATE TRIGGER update_employee_pto_balances_updated_at
  BEFORE UPDATE ON public.employee_pto_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. incident_reports
CREATE TABLE public.incident_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL,
  involved_user_id UUID,
  incident_type TEXT NOT NULL DEFAULT 'other',
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  location_id TEXT,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low',
  witnesses TEXT,
  corrective_action TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters can view their own reports"
  ON public.incident_reports FOR SELECT
  USING (auth.uid() = reported_by);

CREATE POLICY "Reporters can create reports"
  ON public.incident_reports FOR INSERT
  WITH CHECK (auth.uid() = reported_by AND public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Managers can view all org reports"
  ON public.incident_reports FOR SELECT
  USING (public.is_coach_or_admin(auth.uid()) AND public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Managers can manage org reports"
  ON public.incident_reports FOR ALL
  USING (public.is_coach_or_admin(auth.uid()) AND public.is_org_member(auth.uid(), organization_id));

CREATE TRIGGER update_incident_reports_updated_at
  BEFORE UPDATE ON public.incident_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
