
-- Add new columns to phorest_clients for Phorest data model alignment
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS landline TEXT;
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS reminder_email_opt_in BOOLEAN DEFAULT true;
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS reminder_sms_opt_in BOOLEAN DEFAULT true;
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS client_category TEXT;
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS external_client_id TEXT;
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS prompt_client_notes BOOLEAN DEFAULT false;
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS prompt_appointment_notes BOOLEAN DEFAULT false;
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS zip TEXT;
ALTER TABLE public.phorest_clients ADD COLUMN IF NOT EXISTS country TEXT;

-- Backfill first_name and last_name from existing name column
UPDATE public.phorest_clients
SET 
  first_name = CASE 
    WHEN name IS NOT NULL AND position(' ' IN name) > 0 THEN left(name, position(' ' IN name) - 1)
    ELSE name
  END,
  last_name = CASE 
    WHEN name IS NOT NULL AND position(' ' IN name) > 0 THEN substring(name FROM position(' ' IN name) + 1)
    ELSE NULL
  END
WHERE first_name IS NULL AND name IS NOT NULL;
