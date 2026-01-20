-- Add location_id and recurrence fields to assistant_requests
ALTER TABLE public.assistant_requests 
ADD COLUMN IF NOT EXISTS location_id text REFERENCES public.locations(id),
ADD COLUMN IF NOT EXISTS recurrence_type text CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'biweekly', 'monthly')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS recurrence_end_date date,
ADD COLUMN IF NOT EXISTS parent_request_id uuid REFERENCES public.assistant_requests(id);

-- Create index for location filtering
CREATE INDEX IF NOT EXISTS idx_assistant_requests_location ON public.assistant_requests(location_id);

-- Create index for recurrence lookups
CREATE INDEX IF NOT EXISTS idx_assistant_requests_parent ON public.assistant_requests(parent_request_id);

-- Add location_id to assistant_assignments for location-based round-robin
ALTER TABLE public.assistant_assignments
ADD COLUMN IF NOT EXISTS location_id text REFERENCES public.locations(id);

-- Create unique index for location-based assignment tracking  
DROP INDEX IF EXISTS idx_assistant_assignments_user_location;
CREATE UNIQUE INDEX idx_assistant_assignments_user_location 
ON public.assistant_assignments(assistant_id, location_id) 
WHERE location_id IS NOT NULL;