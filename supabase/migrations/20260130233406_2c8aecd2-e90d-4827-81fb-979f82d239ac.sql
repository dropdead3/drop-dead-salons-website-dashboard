-- =============================================
-- MULTI-PROVIDER PAYROLL SYSTEM
-- Supports both Gusto and QuickBooks payroll providers
-- =============================================

-- Create payroll provider enum
CREATE TYPE public.payroll_provider AS ENUM ('gusto', 'quickbooks');

-- =============================================
-- Table: payroll_connections
-- Stores OAuth connections for payroll providers
-- One active provider per organization (UNIQUE constraint)
-- =============================================
CREATE TABLE public.payroll_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider public.payroll_provider NOT NULL,
    external_company_id TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    connection_status TEXT NOT NULL DEFAULT 'pending' CHECK (connection_status IN ('pending', 'connected', 'disconnected', 'error')),
    connected_by UUID REFERENCES auth.users(id),
    connected_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_org_payroll_connection UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.payroll_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payroll_connections
CREATE POLICY "Org admins can view payroll connections"
  ON public.payroll_connections FOR SELECT
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage payroll connections"
  ON public.payroll_connections FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Platform users can view all payroll connections"
  ON public.payroll_connections FOR SELECT
  USING (public.is_platform_user(auth.uid()));

-- =============================================
-- Table: payroll_runs
-- Local record of payroll runs for reporting/audit
-- =============================================
CREATE TABLE public.payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider public.payroll_provider NOT NULL,
    external_payroll_id TEXT,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    check_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'processing', 'processed', 'cancelled', 'failed')),
    total_gross_pay NUMERIC(12,2) DEFAULT 0,
    total_employer_taxes NUMERIC(12,2) DEFAULT 0,
    total_employee_deductions NUMERIC(12,2) DEFAULT 0,
    total_net_pay NUMERIC(12,2) DEFAULT 0,
    employee_count INTEGER DEFAULT 0,
    submitted_by UUID REFERENCES auth.users(id),
    submitted_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payroll_runs
CREATE POLICY "Org admins can view payroll runs"
  ON public.payroll_runs FOR SELECT
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage payroll runs"
  ON public.payroll_runs FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Platform users can view all payroll runs"
  ON public.payroll_runs FOR SELECT
  USING (public.is_platform_user(auth.uid()));

-- =============================================
-- Table: employee_payroll_settings
-- Per-employee payroll configuration
-- =============================================
CREATE TABLE public.employee_payroll_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employee_profiles(user_id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    external_employee_id TEXT,
    pay_type TEXT NOT NULL DEFAULT 'hourly' CHECK (pay_type IN ('hourly', 'salary', 'commission', 'hourly_plus_commission', 'salary_plus_commission')),
    hourly_rate NUMERIC(10,2),
    salary_amount NUMERIC(12,2),
    commission_enabled BOOLEAN DEFAULT false,
    direct_deposit_status TEXT DEFAULT 'not_started' CHECK (direct_deposit_status IN ('not_started', 'pending', 'verified', 'failed')),
    is_payroll_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_employee_org_payroll UNIQUE(employee_id, organization_id)
);

-- Enable RLS
ALTER TABLE public.employee_payroll_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_payroll_settings
CREATE POLICY "Org admins can view employee payroll settings"
  ON public.employee_payroll_settings FOR SELECT
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage employee payroll settings"
  ON public.employee_payroll_settings FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Employees can view own payroll settings"
  ON public.employee_payroll_settings FOR SELECT
  USING (auth.uid() = employee_id);

CREATE POLICY "Platform users can view all employee payroll settings"
  ON public.employee_payroll_settings FOR SELECT
  USING (public.is_platform_user(auth.uid()));

-- =============================================
-- Table: payroll_line_items
-- Detailed breakdown per employee per payroll run
-- =============================================
CREATE TABLE public.payroll_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employee_profiles(user_id) ON DELETE CASCADE,
    external_employee_id TEXT,
    gross_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
    regular_hours NUMERIC(8,2) DEFAULT 0,
    overtime_hours NUMERIC(8,2) DEFAULT 0,
    hourly_pay NUMERIC(12,2) DEFAULT 0,
    salary_pay NUMERIC(12,2) DEFAULT 0,
    commission_pay NUMERIC(12,2) DEFAULT 0,
    bonus_pay NUMERIC(12,2) DEFAULT 0,
    tips NUMERIC(12,2) DEFAULT 0,
    employee_taxes NUMERIC(12,2) DEFAULT 0,
    employee_deductions NUMERIC(12,2) DEFAULT 0,
    employer_taxes NUMERIC(12,2) DEFAULT 0,
    net_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payroll_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payroll_line_items
CREATE POLICY "Org admins can view payroll line items"
  ON public.payroll_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payroll_runs pr
      WHERE pr.id = payroll_run_id
      AND public.is_org_admin(auth.uid(), pr.organization_id)
    )
  );

CREATE POLICY "Org admins can manage payroll line items"
  ON public.payroll_line_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.payroll_runs pr
      WHERE pr.id = payroll_run_id
      AND public.is_org_admin(auth.uid(), pr.organization_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.payroll_runs pr
      WHERE pr.id = payroll_run_id
      AND public.is_org_admin(auth.uid(), pr.organization_id)
    )
  );

CREATE POLICY "Employees can view own payroll line items"
  ON public.payroll_line_items FOR SELECT
  USING (auth.uid() = employee_id);

CREATE POLICY "Platform users can view all payroll line items"
  ON public.payroll_line_items FOR SELECT
  USING (public.is_platform_user(auth.uid()));

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX idx_payroll_connections_org ON public.payroll_connections(organization_id);
CREATE INDEX idx_payroll_connections_provider ON public.payroll_connections(provider);
CREATE INDEX idx_payroll_connections_status ON public.payroll_connections(connection_status);

CREATE INDEX idx_payroll_runs_org ON public.payroll_runs(organization_id);
CREATE INDEX idx_payroll_runs_provider ON public.payroll_runs(provider);
CREATE INDEX idx_payroll_runs_status ON public.payroll_runs(status);
CREATE INDEX idx_payroll_runs_dates ON public.payroll_runs(pay_period_start, pay_period_end);

CREATE INDEX idx_employee_payroll_settings_org ON public.employee_payroll_settings(organization_id);
CREATE INDEX idx_employee_payroll_settings_employee ON public.employee_payroll_settings(employee_id);

CREATE INDEX idx_payroll_line_items_run ON public.payroll_line_items(payroll_run_id);
CREATE INDEX idx_payroll_line_items_employee ON public.payroll_line_items(employee_id);

-- =============================================
-- Updated_at triggers
-- =============================================
CREATE TRIGGER update_payroll_connections_updated_at
  BEFORE UPDATE ON public.payroll_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_runs_updated_at
  BEFORE UPDATE ON public.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_payroll_settings_updated_at
  BEFORE UPDATE ON public.employee_payroll_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_line_items_updated_at
  BEFORE UPDATE ON public.payroll_line_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Add payroll permissions
-- =============================================
INSERT INTO public.permissions (name, display_name, description, category) VALUES
  ('manage_payroll', 'Manage Payroll', 'Run payroll and manage payroll settings', 'admin'),
  ('view_payroll_reports', 'View Payroll Reports', 'View payroll history and reports', 'admin'),
  ('manage_employee_compensation', 'Manage Employee Compensation', 'Edit employee pay rates and settings', 'admin')
ON CONFLICT (name) DO NOTHING;

-- Link permissions to roles (super_admin and admin get full access, manager gets view only)
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'super_admin'::app_role, id FROM public.permissions WHERE name IN ('manage_payroll', 'view_payroll_reports', 'manage_employee_compensation')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions WHERE name IN ('manage_payroll', 'view_payroll_reports', 'manage_employee_compensation')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'manager'::app_role, id FROM public.permissions WHERE name = 'view_payroll_reports'
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE public.payroll_connections IS 'OAuth connections for payroll providers (Gusto, QuickBooks). One active provider per organization.';
COMMENT ON TABLE public.payroll_runs IS 'Local audit trail of payroll runs for reporting and compliance.';
COMMENT ON TABLE public.employee_payroll_settings IS 'Per-employee payroll configuration including pay type and external provider mapping.';
COMMENT ON TABLE public.payroll_line_items IS 'Detailed pay breakdown per employee for each payroll run.';