
-- Add archive columns to phorest_clients
ALTER TABLE public.phorest_clients 
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid;

-- Add sms_opt_out to client_email_preferences
ALTER TABLE public.client_email_preferences
  ADD COLUMN IF NOT EXISTS sms_opt_out boolean NOT NULL DEFAULT false;

-- Index for filtering archived clients
CREATE INDEX IF NOT EXISTS idx_phorest_clients_is_archived ON public.phorest_clients(is_archived);
