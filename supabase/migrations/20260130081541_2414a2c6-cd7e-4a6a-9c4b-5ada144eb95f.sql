-- Subscription Plans Table
CREATE TABLE public.subscription_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tier TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0,
    price_annually NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stripe_price_id_monthly TEXT,
    stripe_price_id_annual TEXT,
    max_locations INTEGER DEFAULT 1,
    max_users INTEGER DEFAULT 5,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Subscription Invoices Table
CREATE TABLE public.subscription_invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL DEFAULT 'pending',
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    invoice_url TEXT,
    invoice_pdf TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add subscription columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX idx_subscription_invoices_org ON public.subscription_invoices(organization_id);
CREATE INDEX idx_subscription_invoices_status ON public.subscription_invoices(status);
CREATE INDEX idx_organizations_stripe_customer ON public.organizations(stripe_customer_id);
CREATE INDEX idx_organizations_subscription_status ON public.organizations(subscription_status);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

CREATE POLICY "Platform users can manage subscription plans"
ON public.subscription_plans
FOR ALL
TO authenticated
USING (public.is_platform_user(auth.uid()))
WITH CHECK (public.is_platform_user(auth.uid()));

-- RLS Policies for subscription_invoices
CREATE POLICY "Platform users can view all invoices"
ON public.subscription_invoices
FOR SELECT
TO authenticated
USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Org admins can view their invoices"
ON public.subscription_invoices
FOR SELECT
TO authenticated
USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Platform users can manage invoices"
ON public.subscription_invoices
FOR ALL
TO authenticated
USING (public.is_platform_user(auth.uid()))
WITH CHECK (public.is_platform_user(auth.uid()));

-- Insert default subscription plans
INSERT INTO public.subscription_plans (tier, name, description, price_monthly, price_annually, max_locations, max_users, features) VALUES
('starter', 'Starter Plan', 'Perfect for small salons getting started', 99.00, 948.00, 1, 5, '{"basic_booking": true, "client_management": true, "basic_reports": true}'),
('standard', 'Standard Plan', 'For growing salons with multiple stylists', 199.00, 1908.00, 2, 15, '{"basic_booking": true, "client_management": true, "advanced_reports": true, "marketing_tools": true, "inventory": true}'),
('professional', 'Professional Plan', 'For established salons with advanced needs', 349.00, 3348.00, 5, 30, '{"basic_booking": true, "client_management": true, "advanced_reports": true, "marketing_tools": true, "inventory": true, "api_access": true, "priority_support": true}'),
('enterprise', 'Enterprise Plan', 'Custom solutions for large salon groups', 0.00, 0.00, -1, -1, '{"all_features": true, "custom_integrations": true, "dedicated_support": true, "sla": true}');

-- Update trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_invoices_updated_at
BEFORE UPDATE ON public.subscription_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();