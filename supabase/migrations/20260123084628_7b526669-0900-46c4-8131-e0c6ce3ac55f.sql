-- Add lead_source column to phorest_clients table
ALTER TABLE public.phorest_clients 
ADD COLUMN IF NOT EXISTS lead_source TEXT;

-- Add client_id column to phorest_appointments to link to phorest_clients
ALTER TABLE public.phorest_appointments 
ADD COLUMN IF NOT EXISTS phorest_client_id TEXT;

-- Add is_new_client flag to appointments for quick filtering
ALTER TABLE public.phorest_appointments 
ADD COLUMN IF NOT EXISTS is_new_client BOOLEAN DEFAULT false;

-- Add index for lead_source queries
CREATE INDEX IF NOT EXISTS idx_phorest_clients_lead_source ON public.phorest_clients(lead_source);

-- Add index for client_id on appointments
CREATE INDEX IF NOT EXISTS idx_phorest_appointments_client_id ON public.phorest_appointments(phorest_client_id);

-- Common lead sources enum type comment (for reference, stored as text for flexibility)
COMMENT ON COLUMN public.phorest_clients.lead_source IS 'Lead source: google, social_media, website_inquiry, phone_inquiry, walk_in, referral, other';