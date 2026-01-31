-- Insert booth_renter role into roles table
INSERT INTO public.roles (name, display_name, description, color, icon, sort_order, is_system)
VALUES ('booth_renter', 'Booth Renter', 'Independent stylist renting space', '#f97316', 'Store', 7, true)
ON CONFLICT (name) DO NOTHING;

-- Booth Renter Profiles Table
CREATE TABLE public.booth_renter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Business Info
  business_name TEXT,
  business_license_number TEXT,
  license_state TEXT,
  ein_number TEXT,
  
  -- Contact
  billing_email TEXT,
  billing_phone TEXT,
  billing_address JSONB,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'terminated')),
  onboarding_complete BOOLEAN DEFAULT false,
  
  -- Dates
  start_date DATE,
  end_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, organization_id)
);

-- Booth Rental Contracts Table
CREATE TABLE public.booth_rental_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  booth_renter_id UUID NOT NULL REFERENCES booth_renter_profiles(id) ON DELETE CASCADE,
  
  -- Contract Details
  contract_name TEXT NOT NULL,
  contract_type TEXT DEFAULT 'standard' CHECK (contract_type IN ('standard', 'month_to_month', 'annual')),
  
  -- PandaDoc Integration
  pandadoc_document_id TEXT,
  pandadoc_status TEXT DEFAULT 'draft' CHECK (pandadoc_status IN ('draft', 'sent', 'viewed', 'completed', 'voided', 'declined')),
  document_url TEXT,
  signed_at TIMESTAMPTZ,
  
  -- Terms
  start_date DATE NOT NULL,
  end_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  notice_period_days INTEGER DEFAULT 30,
  
  -- Rent Configuration
  rent_amount DECIMAL(10,2) NOT NULL,
  rent_frequency TEXT NOT NULL CHECK (rent_frequency IN ('weekly', 'monthly')),
  due_day_of_week INTEGER CHECK (due_day_of_week >= 0 AND due_day_of_week <= 6),
  due_day_of_month INTEGER CHECK (due_day_of_month >= 1 AND due_day_of_month <= 28),
  
  -- Additional Terms
  security_deposit DECIMAL(10,2) DEFAULT 0,
  security_deposit_paid BOOLEAN DEFAULT false,
  includes_utilities BOOLEAN DEFAULT true,
  includes_wifi BOOLEAN DEFAULT true,
  includes_products BOOLEAN DEFAULT false,
  additional_terms JSONB,
  
  -- Retail Commission
  retail_commission_enabled BOOLEAN DEFAULT true,
  retail_commission_rate DECIMAL(5,4) DEFAULT 0.10,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signature', 'active', 'expired', 'terminated')),
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rent Payments Table
CREATE TABLE public.rent_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  booth_renter_id UUID NOT NULL REFERENCES booth_renter_profiles(id),
  contract_id UUID NOT NULL REFERENCES booth_rental_contracts(id),
  
  -- Payment Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Amounts
  base_rent DECIMAL(10,2) NOT NULL,
  late_fee DECIMAL(10,2) DEFAULT 0,
  credits_applied DECIMAL(10,2) DEFAULT 0,
  adjustments DECIMAL(10,2) DEFAULT 0,
  adjustment_notes TEXT,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  
  -- Payment Details
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'waived')),
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  
  -- Auto-pay
  autopay_scheduled BOOLEAN DEFAULT false,
  autopay_attempted_at TIMESTAMPTZ,
  autopay_failed_reason TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Renter Payment Settings Table
CREATE TABLE public.renter_payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_renter_id UUID NOT NULL REFERENCES booth_renter_profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Stripe Connect
  stripe_customer_id TEXT,
  stripe_payment_method_id TEXT,
  payment_method_last_four TEXT,
  payment_method_brand TEXT,
  payment_method_type TEXT,
  
  -- Auto-pay settings
  autopay_enabled BOOLEAN DEFAULT false,
  autopay_days_before_due INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(booth_renter_id)
);

-- Retail Commission Tracking Table
CREATE TABLE public.renter_retail_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  booth_renter_id UUID NOT NULL REFERENCES booth_renter_profiles(id),
  
  -- Sale Reference
  retail_sale_id UUID,
  sale_date DATE NOT NULL,
  
  -- Commission Details
  sale_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  
  -- Payout
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'included_in_statement', 'paid')),
  payout_date DATE,
  payout_reference TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Renter Onboarding Tasks Table
CREATE TABLE public.renter_onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT DEFAULT 'action' CHECK (task_type IN ('action', 'document', 'form', 'acknowledgment')),
  required BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Optional link/action
  link_url TEXT,
  form_template_id UUID,
  document_template_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.renter_onboarding_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_renter_id UUID NOT NULL REFERENCES booth_renter_profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES renter_onboarding_tasks(id) ON DELETE CASCADE,
  
  completed_at TIMESTAMPTZ DEFAULT now(),
  completed_data JSONB,
  
  UNIQUE(booth_renter_id, task_id)
);

-- Indexes for performance
CREATE INDEX idx_booth_renter_profiles_org ON booth_renter_profiles(organization_id);
CREATE INDEX idx_booth_renter_profiles_user ON booth_renter_profiles(user_id);
CREATE INDEX idx_booth_renter_profiles_status ON booth_renter_profiles(status);
CREATE INDEX idx_booth_rental_contracts_org ON booth_rental_contracts(organization_id);
CREATE INDEX idx_booth_rental_contracts_renter ON booth_rental_contracts(booth_renter_id);
CREATE INDEX idx_booth_rental_contracts_status ON booth_rental_contracts(status);
CREATE INDEX idx_rent_payments_org ON rent_payments(organization_id);
CREATE INDEX idx_rent_payments_renter ON rent_payments(booth_renter_id);
CREATE INDEX idx_rent_payments_due_date ON rent_payments(due_date);
CREATE INDEX idx_rent_payments_status ON rent_payments(status);
CREATE INDEX idx_renter_retail_commissions_renter ON renter_retail_commissions(booth_renter_id);

-- Enable RLS
ALTER TABLE booth_renter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE booth_rental_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE renter_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE renter_retail_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE renter_onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE renter_onboarding_completions ENABLE ROW LEVEL SECURITY;

-- Helper function for booth renter access
CREATE OR REPLACE FUNCTION public.is_booth_renter(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'booth_renter'
  )
$$;

CREATE OR REPLACE FUNCTION public.get_booth_renter_profile_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.booth_renter_profiles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for booth_renter_profiles
CREATE POLICY "Admins can manage booth renter profiles"
ON booth_renter_profiles FOR ALL
TO authenticated
USING (public.is_coach_or_admin(auth.uid()))
WITH CHECK (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Booth renters can view own profile"
ON booth_renter_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for booth_rental_contracts
CREATE POLICY "Admins can manage contracts"
ON booth_rental_contracts FOR ALL
TO authenticated
USING (public.is_coach_or_admin(auth.uid()))
WITH CHECK (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Booth renters can view own contracts"
ON booth_rental_contracts FOR SELECT
TO authenticated
USING (booth_renter_id = public.get_booth_renter_profile_id(auth.uid()));

-- RLS Policies for rent_payments
CREATE POLICY "Admins can manage rent payments"
ON rent_payments FOR ALL
TO authenticated
USING (public.is_coach_or_admin(auth.uid()))
WITH CHECK (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Booth renters can view own payments"
ON rent_payments FOR SELECT
TO authenticated
USING (booth_renter_id = public.get_booth_renter_profile_id(auth.uid()));

-- RLS Policies for renter_payment_settings
CREATE POLICY "Admins can manage payment settings"
ON renter_payment_settings FOR ALL
TO authenticated
USING (public.is_coach_or_admin(auth.uid()))
WITH CHECK (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Booth renters can manage own payment settings"
ON renter_payment_settings FOR ALL
TO authenticated
USING (booth_renter_id = public.get_booth_renter_profile_id(auth.uid()))
WITH CHECK (booth_renter_id = public.get_booth_renter_profile_id(auth.uid()));

-- RLS Policies for renter_retail_commissions
CREATE POLICY "Admins can manage commissions"
ON renter_retail_commissions FOR ALL
TO authenticated
USING (public.is_coach_or_admin(auth.uid()))
WITH CHECK (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Booth renters can view own commissions"
ON renter_retail_commissions FOR SELECT
TO authenticated
USING (booth_renter_id = public.get_booth_renter_profile_id(auth.uid()));

-- RLS Policies for renter_onboarding_tasks
CREATE POLICY "Admins can manage onboarding tasks"
ON renter_onboarding_tasks FOR ALL
TO authenticated
USING (public.is_coach_or_admin(auth.uid()))
WITH CHECK (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Booth renters can view active tasks"
ON renter_onboarding_tasks FOR SELECT
TO authenticated
USING (is_active = true AND public.is_booth_renter(auth.uid()));

-- RLS Policies for renter_onboarding_completions
CREATE POLICY "Admins can manage completions"
ON renter_onboarding_completions FOR ALL
TO authenticated
USING (public.is_coach_or_admin(auth.uid()))
WITH CHECK (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Booth renters can manage own completions"
ON renter_onboarding_completions FOR ALL
TO authenticated
USING (booth_renter_id = public.get_booth_renter_profile_id(auth.uid()))
WITH CHECK (booth_renter_id = public.get_booth_renter_profile_id(auth.uid()));

-- Add permissions to permissions table
INSERT INTO public.permissions (name, display_name, description, category) VALUES
('manage_booth_renters', 'Manage Booth Renters', 'Full CRUD access to booth renter profiles', 'operations'),
('view_booth_renters', 'View Booth Renters', 'Read-only access to booth renter information', 'operations'),
('manage_rent_payments', 'Manage Rent Payments', 'Record and manage rent payments', 'operations'),
('view_rent_payments', 'View Rent Payments', 'View rent payment history', 'operations'),
('view_rent_analytics', 'View Rent Analytics', 'Access rent revenue analytics', 'analytics'),
('issue_renter_contracts', 'Issue Renter Contracts', 'Create and issue rental contracts via PandaDoc', 'operations')
ON CONFLICT (name) DO NOTHING;

-- Grant default permissions to admin roles
INSERT INTO public.role_permissions (role, permission_id, granted_by)
SELECT 'super_admin', id, NULL FROM permissions WHERE name IN ('manage_booth_renters', 'view_booth_renters', 'manage_rent_payments', 'view_rent_payments', 'view_rent_analytics', 'issue_renter_contracts')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id, granted_by)
SELECT 'admin', id, NULL FROM permissions WHERE name IN ('manage_booth_renters', 'view_booth_renters', 'manage_rent_payments', 'view_rent_payments', 'issue_renter_contracts')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id, granted_by)
SELECT 'manager', id, NULL FROM permissions WHERE name IN ('view_booth_renters', 'view_rent_payments')
ON CONFLICT DO NOTHING;

-- Trigger for updated_at
CREATE TRIGGER update_booth_renter_profiles_updated_at
BEFORE UPDATE ON booth_renter_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booth_rental_contracts_updated_at
BEFORE UPDATE ON booth_rental_contracts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rent_payments_updated_at
BEFORE UPDATE ON rent_payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_renter_payment_settings_updated_at
BEFORE UPDATE ON renter_payment_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_renter_onboarding_tasks_updated_at
BEFORE UPDATE ON renter_onboarding_tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();