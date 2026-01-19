-- Create table for impersonation audit logs
CREATE TABLE public.impersonation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'start_role', 'start_user', 'end', 'switch_role', 'switch_user'
  target_role TEXT, -- role being impersonated (if role-based)
  target_user_id UUID, -- user being impersonated (if user-based)
  target_user_name TEXT, -- display name of impersonated user for easier reading
  session_id UUID DEFAULT gen_random_uuid(), -- groups related start/end events
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB -- additional context like page visited, etc.
);

-- Create index for efficient queries
CREATE INDEX idx_impersonation_logs_admin ON public.impersonation_logs(admin_user_id);
CREATE INDEX idx_impersonation_logs_target_user ON public.impersonation_logs(target_user_id);
CREATE INDEX idx_impersonation_logs_created_at ON public.impersonation_logs(created_at DESC);
CREATE INDEX idx_impersonation_logs_session ON public.impersonation_logs(session_id);

-- Enable RLS
ALTER TABLE public.impersonation_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view impersonation logs
CREATE POLICY "Super admins can view impersonation logs"
ON public.impersonation_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employee_profiles
    WHERE user_id = auth.uid()
    AND is_super_admin = true
  )
);

-- Any authenticated user can insert their own impersonation logs (as admin)
CREATE POLICY "Admins can insert their own impersonation logs"
ON public.impersonation_logs
FOR INSERT
TO authenticated
WITH CHECK (admin_user_id = auth.uid());

-- Add comment for documentation
COMMENT ON TABLE public.impersonation_logs IS 'Audit trail for super admin impersonation actions';