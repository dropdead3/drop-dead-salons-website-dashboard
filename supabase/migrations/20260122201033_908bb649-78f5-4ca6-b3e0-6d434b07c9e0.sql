-- Add location tracking to phorest_clients for multi-branch filtering
ALTER TABLE public.phorest_clients 
ADD COLUMN IF NOT EXISTS location_id TEXT REFERENCES public.locations(id) ON DELETE SET NULL;

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_phorest_clients_location ON public.phorest_clients(location_id);

-- Also add location to allow filtering clients by where they were last seen
ALTER TABLE public.phorest_clients 
ADD COLUMN IF NOT EXISTS phorest_branch_id TEXT,
ADD COLUMN IF NOT EXISTS branch_name TEXT;