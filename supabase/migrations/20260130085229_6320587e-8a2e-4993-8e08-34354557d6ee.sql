-- Add new columns to organization_billing for add-on capacity tracking
ALTER TABLE public.organization_billing
ADD COLUMN IF NOT EXISTS per_user_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS additional_locations_purchased integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS additional_users_purchased integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS included_locations integer,
ADD COLUMN IF NOT EXISTS included_users integer;

-- Create billing_changes table for audit trail
CREATE TABLE public.billing_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  change_type text NOT NULL CHECK (change_type IN ('plan_upgrade', 'plan_downgrade', 'add_locations', 'add_users', 'pricing_change', 'promo_applied', 'contract_change')),
  previous_value jsonb,
  new_value jsonb,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  proration_amount numeric DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.billing_changes ENABLE ROW LEVEL SECURITY;

-- Platform users can view and insert all billing changes
CREATE POLICY "Platform users can view all billing changes"
ON public.billing_changes
FOR SELECT
TO authenticated
USING (public.is_platform_user(auth.uid()));

CREATE POLICY "Platform users can insert billing changes"
ON public.billing_changes
FOR INSERT
TO authenticated
WITH CHECK (public.is_platform_user(auth.uid()));

-- Org admins can view their own billing changes
CREATE POLICY "Org admins can view own billing changes"
ON public.billing_changes
FOR SELECT
TO authenticated
USING (public.is_org_admin(auth.uid(), organization_id));

-- Create index for faster lookups
CREATE INDEX idx_billing_changes_org_id ON public.billing_changes(organization_id);
CREATE INDEX idx_billing_changes_created_at ON public.billing_changes(created_at DESC);