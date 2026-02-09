-- =====================================================
-- Category 2: Analytics & Reporting Enhancements
-- Custom Report Builder, Scheduled Reports, Benchmarks
-- =====================================================

-- Custom report templates
CREATE TABLE public.custom_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_shared BOOLEAN DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Track template usage for popularity sorting
CREATE TABLE public.report_template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.custom_report_templates(id) ON DELETE CASCADE,
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled report configurations
CREATE TABLE public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.custom_report_templates(id) ON DELETE SET NULL,
  report_type TEXT,
  name TEXT NOT NULL,
  schedule_type TEXT NOT NULL,
  schedule_config JSONB DEFAULT '{}'::jsonb,
  recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  format TEXT DEFAULT 'pdf',
  filters JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Execution log for scheduled reports
CREATE TABLE public.scheduled_report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_report_id UUID REFERENCES public.scheduled_reports(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  file_url TEXT,
  recipient_count INTEGER,
  error_message TEXT
);

-- Store benchmark data (org-specific or industry-wide)
CREATE TABLE public.metric_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  benchmark_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  context TEXT,
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.custom_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_template_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_report_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_report_templates
CREATE POLICY "View org templates or own" ON public.custom_report_templates
  FOR SELECT USING (
    organization_id = public.get_user_organization(auth.uid())
    OR created_by = auth.uid()
  );

CREATE POLICY "Insert own templates" ON public.custom_report_templates
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Update own templates" ON public.custom_report_templates
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Delete own templates" ON public.custom_report_templates
  FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for report_template_usage
CREATE POLICY "View own usage" ON public.report_template_usage
  FOR SELECT USING (used_by = auth.uid());

CREATE POLICY "Insert own usage" ON public.report_template_usage
  FOR INSERT WITH CHECK (used_by = auth.uid());

-- RLS Policies for scheduled_reports
CREATE POLICY "View org scheduled reports" ON public.scheduled_reports
  FOR SELECT USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Insert org scheduled reports" ON public.scheduled_reports
  FOR INSERT WITH CHECK (
    organization_id = public.get_user_organization(auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Update own scheduled reports" ON public.scheduled_reports
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Delete own scheduled reports" ON public.scheduled_reports
  FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for scheduled_report_runs
CREATE POLICY "View org report runs" ON public.scheduled_report_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_reports sr
      WHERE sr.id = scheduled_report_id
      AND sr.organization_id = public.get_user_organization(auth.uid())
    )
  );

-- RLS Policies for metric_benchmarks
CREATE POLICY "View org or industry benchmarks" ON public.metric_benchmarks
  FOR SELECT USING (
    organization_id IS NULL
    OR organization_id = public.get_user_organization(auth.uid())
  );

CREATE POLICY "Manage org benchmarks" ON public.metric_benchmarks
  FOR ALL USING (
    organization_id = public.get_user_organization(auth.uid())
    AND public.is_coach_or_admin(auth.uid())
  );

-- Trigger for updated_at on custom_report_templates
CREATE TRIGGER update_custom_report_templates_updated_at
  BEFORE UPDATE ON public.custom_report_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed industry benchmarks
INSERT INTO public.metric_benchmarks (organization_id, metric_key, benchmark_type, value, context, valid_from, valid_to)
VALUES
  (NULL, 'avg_ticket', 'industry', 85.00, 'salon_industry_2025', '2025-01-01', '2025-12-31'),
  (NULL, 'retention_rate', 'industry', 68.00, 'salon_industry_2025', '2025-01-01', '2025-12-31'),
  (NULL, 'rebooking_rate', 'industry', 42.00, 'salon_industry_2025', '2025-01-01', '2025-12-31'),
  (NULL, 'utilization_rate', 'industry', 75.00, 'salon_industry_2025', '2025-01-01', '2025-12-31'),
  (NULL, 'retail_attachment', 'industry', 25.00, 'salon_industry_2025', '2025-01-01', '2025-12-31'),
  (NULL, 'no_show_rate', 'industry', 8.00, 'salon_industry_2025', '2025-01-01', '2025-12-31'),
  (NULL, 'new_client_rate', 'industry', 15.00, 'salon_industry_2025', '2025-01-01', '2025-12-31');