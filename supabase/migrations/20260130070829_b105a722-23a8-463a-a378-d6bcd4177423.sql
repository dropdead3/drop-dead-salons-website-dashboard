-- Create a sequence starting at 1000 for account numbers
CREATE SEQUENCE IF NOT EXISTS organization_account_number_seq START WITH 1000;

-- Add account_number column to organizations with auto-generated default
ALTER TABLE public.organizations 
ADD COLUMN account_number INTEGER UNIQUE DEFAULT nextval('organization_account_number_seq');

-- Backfill existing organizations with account numbers
UPDATE public.organizations 
SET account_number = nextval('organization_account_number_seq')
WHERE account_number IS NULL;

-- Add geography fields to locations
ALTER TABLE public.locations
ADD COLUMN state_province TEXT,
ADD COLUMN country TEXT DEFAULT 'US';

-- Add Stripe payment fields to locations
ALTER TABLE public.locations
ADD COLUMN stripe_account_id TEXT,
ADD COLUMN stripe_payments_enabled BOOLEAN DEFAULT false,
ADD COLUMN stripe_status TEXT DEFAULT 'not_connected' 
  CHECK (stripe_status IN ('not_connected', 'pending', 'active', 'issues', 'suspended'));