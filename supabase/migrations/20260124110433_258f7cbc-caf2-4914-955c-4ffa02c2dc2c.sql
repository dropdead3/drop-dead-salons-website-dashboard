-- Create feature flags table for controlling feature rollouts
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT UNIQUE NOT NULL,
  flag_name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_enabled BOOLEAN DEFAULT false,
  enabled_for_roles TEXT[] DEFAULT '{}',
  enabled_for_users UUID[] DEFAULT '{}',
  percentage_rollout INTEGER DEFAULT 100 CHECK (percentage_rollout >= 0 AND percentage_rollout <= 100),
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can read feature flags (needed for frontend checks)
CREATE POLICY "Feature flags are viewable by authenticated users"
ON public.feature_flags
FOR SELECT
TO authenticated
USING (true);

-- Only super admins can manage feature flags
CREATE POLICY "Super admins can insert feature flags"
ON public.feature_flags
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employee_profiles
    WHERE user_id = auth.uid()
    AND is_super_admin = true
  )
);

CREATE POLICY "Super admins can update feature flags"
ON public.feature_flags
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employee_profiles
    WHERE user_id = auth.uid()
    AND is_super_admin = true
  )
);

CREATE POLICY "Super admins can delete feature flags"
ON public.feature_flags
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employee_profiles
    WHERE user_id = auth.uid()
    AND is_super_admin = true
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for fast lookups
CREATE INDEX idx_feature_flags_key ON public.feature_flags(flag_key);
CREATE INDEX idx_feature_flags_category ON public.feature_flags(category);
CREATE INDEX idx_feature_flags_enabled ON public.feature_flags(is_enabled);

-- Add some initial feature flags as examples
INSERT INTO public.feature_flags (flag_key, flag_name, description, category, is_enabled) VALUES
('new_dashboard_layout', 'New Dashboard Layout', 'Enable the redesigned dashboard layout', 'ui', false),
('advanced_analytics', 'Advanced Analytics', 'Enable advanced analytics features', 'analytics', false),
('beta_features', 'Beta Features', 'Access to beta features', 'experimental', false);

-- Enable realtime for feature flags
ALTER PUBLICATION supabase_realtime ADD TABLE public.feature_flags;