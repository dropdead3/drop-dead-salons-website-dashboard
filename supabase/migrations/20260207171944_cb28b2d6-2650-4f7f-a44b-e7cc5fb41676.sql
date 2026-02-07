-- Create organization payroll settings table for pay schedule configuration
CREATE TABLE public.organization_payroll_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Pay schedule type: 'semi_monthly', 'bi_weekly', 'weekly', 'monthly'
  pay_schedule_type TEXT NOT NULL DEFAULT 'semi_monthly',
  
  -- For semi-monthly: day of month for first pay day (e.g., 1, 15)
  semi_monthly_first_day INTEGER NOT NULL DEFAULT 1,
  semi_monthly_second_day INTEGER NOT NULL DEFAULT 15,
  
  -- For bi-weekly: day of week (0=Sunday, 1=Monday, etc.)
  bi_weekly_day_of_week INTEGER NOT NULL DEFAULT 5, -- Friday
  bi_weekly_start_date DATE, -- Anchor date for bi-weekly calculation
  
  -- For weekly: day of week
  weekly_day_of_week INTEGER NOT NULL DEFAULT 5, -- Friday
  
  -- For monthly: day of month
  monthly_pay_day INTEGER NOT NULL DEFAULT 1,
  
  -- Days after period end when check is issued
  days_until_check INTEGER NOT NULL DEFAULT 5,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.organization_payroll_settings ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check org membership
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employee_profiles 
    WHERE user_id = _user_id 
    AND organization_id = _org_id
    AND is_approved = true
  )
  OR EXISTS (
    SELECT 1 FROM public.organization_admins
    WHERE user_id = _user_id
    AND organization_id = _org_id
  )
  OR public.is_platform_user(_user_id)
$$;

-- RLS policy for admin access (full CRUD)
CREATE POLICY "Admins can manage pay schedule settings"
  ON public.organization_payroll_settings
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

-- All org members can read pay schedule
CREATE POLICY "Org members can read pay schedule"
  ON public.organization_payroll_settings
  FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id)
  );

-- Create updated_at trigger
CREATE TRIGGER update_organization_payroll_settings_updated_at
  BEFORE UPDATE ON public.organization_payroll_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.organization_payroll_settings IS 'Stores pay schedule configuration for organizations, used for calculating pay periods and filtering analytics';