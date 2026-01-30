-- Add non-renewal tracking columns to organization_billing
ALTER TABLE public.organization_billing 
ADD COLUMN IF NOT EXISTS non_renewal_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS non_renewal_reason TEXT;

-- Add comments for clarity
COMMENT ON COLUMN public.organization_billing.non_renewal_requested_at 
IS 'Timestamp when the customer requested to not renew at term end';

COMMENT ON COLUMN public.organization_billing.non_renewal_reason 
IS 'Reason provided for not renewing the contract';