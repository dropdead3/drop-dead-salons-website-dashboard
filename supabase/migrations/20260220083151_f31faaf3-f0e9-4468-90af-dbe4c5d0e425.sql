
-- Add birthday and client_since columns to phorest_clients table
ALTER TABLE public.phorest_clients 
ADD COLUMN IF NOT EXISTS birthday date,
ADD COLUMN IF NOT EXISTS client_since date;

-- Backfill client_since from created_at for existing records
UPDATE public.phorest_clients 
SET client_since = created_at::date 
WHERE client_since IS NULL AND created_at IS NOT NULL;
