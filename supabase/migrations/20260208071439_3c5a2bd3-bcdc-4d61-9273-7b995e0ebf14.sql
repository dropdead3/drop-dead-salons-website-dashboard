-- Add is_required column to onboarding_tasks
ALTER TABLE public.onboarding_tasks 
ADD COLUMN IF NOT EXISTS is_required boolean DEFAULT true NOT NULL;

-- Create onboarding_section_config table for per-role section configuration
CREATE TABLE IF NOT EXISTS public.onboarding_section_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  section_key text NOT NULL,  -- 'business_card', 'headshot', 'handbooks'
  role text NOT NULL,
  is_enabled boolean DEFAULT true NOT NULL,
  is_required boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, section_key, role)
);

-- Enable RLS
ALTER TABLE public.onboarding_section_config ENABLE ROW LEVEL SECURITY;

-- Policy for org admins to manage onboarding config
CREATE POLICY "Org admins can manage onboarding config"
  ON public.onboarding_section_config
  FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Policy for authenticated users to read their org's config
CREATE POLICY "Users can read their org onboarding config"
  ON public.onboarding_section_config
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.employee_profiles WHERE user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_onboarding_section_config_updated_at
  BEFORE UPDATE ON public.onboarding_section_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();