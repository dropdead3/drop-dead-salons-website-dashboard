-- Feature 2: Edge function execution logs
CREATE TABLE IF NOT EXISTS public.edge_function_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error', 'timeout')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  organization_id UUID REFERENCES organizations(id),
  triggered_by TEXT DEFAULT 'cron'
);

CREATE INDEX IF NOT EXISTS idx_edge_function_logs_query 
ON public.edge_function_logs(function_name, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_edge_function_logs_status 
ON public.edge_function_logs(status, started_at DESC);

-- Feature 3: Organization feature flag overrides
CREATE TABLE IF NOT EXISTS public.organization_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL,
  override_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, flag_key)
);

CREATE INDEX IF NOT EXISTS idx_org_feature_flags_org 
ON public.organization_feature_flags(organization_id);

-- Feature 4: Platform notifications
CREATE TABLE IF NOT EXISTS public.platform_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_notifications_recipient 
ON public.platform_notifications(recipient_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS public.platform_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  slack_enabled BOOLEAN DEFAULT false,
  UNIQUE(user_id, notification_type)
);

-- Feature 5: System health cache
CREATE TABLE IF NOT EXISTS public.system_health_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down', 'unknown')),
  response_time_ms INTEGER,
  last_checked_at TIMESTAMPTZ DEFAULT now(),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- RLS policies for all tables
ALTER TABLE public.edge_function_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_status ENABLE ROW LEVEL SECURITY;

-- Edge function logs - platform users only
CREATE POLICY "Platform users view function logs"
ON public.edge_function_logs FOR SELECT TO authenticated
USING (public.is_platform_user(auth.uid()));

CREATE POLICY "System can insert function logs"
ON public.edge_function_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- Org feature flags - platform admins
CREATE POLICY "Platform admins manage org flags"
ON public.organization_feature_flags FOR ALL TO authenticated
USING (public.is_platform_user(auth.uid()))
WITH CHECK (public.is_platform_user(auth.uid()));

-- Platform notifications
CREATE POLICY "Platform users see notifications"
ON public.platform_notifications FOR SELECT TO authenticated
USING (
  public.is_platform_user(auth.uid()) 
  AND (recipient_id IS NULL OR recipient_id = auth.uid())
);

CREATE POLICY "Platform users update read status"
ON public.platform_notifications FOR UPDATE TO authenticated
USING (
  public.is_platform_user(auth.uid()) 
  AND (recipient_id IS NULL OR recipient_id = auth.uid())
)
WITH CHECK (
  public.is_platform_user(auth.uid()) 
  AND (recipient_id IS NULL OR recipient_id = auth.uid())
);

CREATE POLICY "System can insert notifications"
ON public.platform_notifications FOR INSERT TO authenticated
WITH CHECK (true);

-- Notification preferences
CREATE POLICY "Users manage notification prefs"
ON public.platform_notification_preferences FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- System health - platform users can view
CREATE POLICY "Platform users view system health"
ON public.system_health_status FOR SELECT TO authenticated
USING (public.is_platform_user(auth.uid()));

CREATE POLICY "System can update health status"
ON public.system_health_status FOR ALL TO authenticated
WITH CHECK (true);