-- Usage metrics table for tracking organization usage
CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  total_locations INTEGER DEFAULT 0,
  total_appointments INTEGER DEFAULT 0,
  total_clients INTEGER DEFAULT 0,
  storage_used_mb NUMERIC(10,2) DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, period_start)
);

-- Churn risk scores table
CREATE TABLE IF NOT EXISTS public.churn_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  factors JSONB,
  recommendations TEXT[],
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Data exports table
CREATE TABLE IF NOT EXISTS public.data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL,
  format TEXT DEFAULT 'json',
  status TEXT DEFAULT 'pending',
  record_count INTEGER DEFAULT 0,
  requested_by UUID,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Weekly digests table
CREATE TABLE IF NOT EXISTS public.weekly_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start TIMESTAMP WITH TIME ZONE NOT NULL,
  week_end TIMESTAMP WITH TIME ZONE NOT NULL,
  kpis JSONB NOT NULL,
  recipients TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Archived appointments table
CREATE TABLE IF NOT EXISTS public.archived_appointments (
  id UUID PRIMARY KEY,
  appointment_date DATE,
  client_id UUID,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  staff_user_id UUID,
  staff_name TEXT,
  service_id UUID,
  service_name TEXT,
  service_category TEXT,
  location_id TEXT,
  organization_id UUID,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  status TEXT,
  total_price NUMERIC(10,2),
  original_price NUMERIC(10,2),
  tip_amount NUMERIC(10,2),
  notes TEXT,
  client_notes TEXT,
  payment_method TEXT,
  rebooked_at_checkout BOOLEAN,
  external_id TEXT,
  import_source TEXT,
  import_job_id UUID,
  imported_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Archived log summaries table
CREATE TABLE IF NOT EXISTS public.archived_log_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  summary JSONB NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Archived notifications table
CREATE TABLE IF NOT EXISTS public.archived_notifications (
  id UUID PRIMARY KEY,
  type TEXT,
  severity TEXT,
  title TEXT,
  message TEXT,
  metadata JSONB,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add missing columns to organizations table
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'professional',
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS access_ends_at TIMESTAMP WITH TIME ZONE;

-- Add retry_count to subscription_invoices
ALTER TABLE public.subscription_invoices
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS line_items JSONB,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Enable RLS on new tables
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churn_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_log_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for platform users only
CREATE POLICY "Platform users can view usage metrics"
  ON public.usage_metrics FOR SELECT
  TO authenticated
  USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform users can view churn risk scores"
  ON public.churn_risk_scores FOR SELECT
  TO authenticated
  USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform users can view data exports"
  ON public.data_exports FOR SELECT
  TO authenticated
  USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform users can view weekly digests"
  ON public.weekly_digests FOR SELECT
  TO authenticated
  USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform users can view archived appointments"
  ON public.archived_appointments FOR SELECT
  TO authenticated
  USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform users can view archived log summaries"
  ON public.archived_log_summaries FOR SELECT
  TO authenticated
  USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform users can view archived notifications"
  ON public.archived_notifications FOR SELECT
  TO authenticated
  USING (public.is_platform_user(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_metrics_org_period ON public.usage_metrics(organization_id, period_start);
CREATE INDEX IF NOT EXISTS idx_churn_risk_scores_org ON public.churn_risk_scores(organization_id);
CREATE INDEX IF NOT EXISTS idx_churn_risk_scores_level ON public.churn_risk_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_data_exports_org ON public.data_exports(organization_id);
CREATE INDEX IF NOT EXISTS idx_archived_appointments_org ON public.archived_appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_archived_appointments_date ON public.archived_appointments(appointment_date);