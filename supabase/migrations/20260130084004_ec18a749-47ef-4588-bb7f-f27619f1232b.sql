-- Create billing cycle enum
CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'quarterly', 'semi_annual', 'annual');

-- Create discount type enum
CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed_amount', 'promotional');

-- Create billing status enum
CREATE TYPE public.billing_status AS ENUM ('draft', 'trialing', 'active', 'past_due', 'paused', 'cancelled');

-- Create organization_billing table
CREATE TABLE public.organization_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
    contract_length_months INTEGER NOT NULL DEFAULT 1,
    contract_start_date DATE,
    contract_end_date DATE,
    base_price NUMERIC(10,2),
    custom_price NUMERIC(10,2),
    discount_type discount_type,
    discount_value NUMERIC(10,2),
    discount_reason TEXT,
    promo_months INTEGER,
    promo_price NUMERIC(10,2),
    promo_ends_at TIMESTAMPTZ,
    trial_days INTEGER DEFAULT 0,
    trial_ends_at TIMESTAMPTZ,
    billing_starts_at TIMESTAMPTZ,
    setup_fee NUMERIC(10,2) DEFAULT 0,
    setup_fee_paid BOOLEAN DEFAULT false,
    per_location_fee NUMERIC(10,2) DEFAULT 0,
    auto_renewal BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_org_billing UNIQUE (organization_id)
);

-- Add billing columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS billing_status billing_status DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS next_invoice_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pause_ends_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE public.organization_billing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_billing
-- Platform users can view and manage all billing
CREATE POLICY "Platform users can view all billing"
ON public.organization_billing
FOR SELECT
TO authenticated
USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform admins can insert billing"
ON public.organization_billing
FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform admins can update billing"
ON public.organization_billing
FOR UPDATE
TO authenticated
USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform admins can delete billing"
ON public.organization_billing
FOR DELETE
TO authenticated
USING (public.is_platform_user(auth.uid()));

-- Org admins can view their own billing
CREATE POLICY "Org admins can view own billing"
ON public.organization_billing
FOR SELECT
TO authenticated
USING (public.is_org_admin(auth.uid(), organization_id));

-- Create updated_at trigger
CREATE TRIGGER update_organization_billing_updated_at
    BEFORE UPDATE ON public.organization_billing
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_organization_billing_org_id ON public.organization_billing(organization_id);
CREATE INDEX idx_organization_billing_plan_id ON public.organization_billing(plan_id);