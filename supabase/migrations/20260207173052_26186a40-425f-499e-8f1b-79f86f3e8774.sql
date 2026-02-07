-- Payroll forecasts table for caching projections
CREATE TABLE public.payroll_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  forecast_data JSONB NOT NULL DEFAULT '{}',
  confidence_level TEXT NOT NULL DEFAULT 'medium',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, period_start, period_end)
);

-- Payroll analytics snapshots for historical trends
CREATE TABLE public.payroll_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, snapshot_date)
);

-- Enable RLS
ALTER TABLE public.payroll_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies for payroll_forecasts
CREATE POLICY "Org members can view payroll forecasts"
  ON public.payroll_forecasts
  FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage payroll forecasts"
  ON public.payroll_forecasts
  FOR ALL
  TO authenticated
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- RLS policies for payroll_analytics_snapshots
CREATE POLICY "Org members can view payroll analytics"
  ON public.payroll_analytics_snapshots
  FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage payroll analytics"
  ON public.payroll_analytics_snapshots
  FOR ALL
  TO authenticated
  USING (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- Add updated_at trigger to payroll_forecasts
CREATE TRIGGER update_payroll_forecasts_updated_at
  BEFORE UPDATE ON public.payroll_forecasts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();