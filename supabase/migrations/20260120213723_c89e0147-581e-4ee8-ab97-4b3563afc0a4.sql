-- Add assigned_at column to track when assignment was made for timeout tracking
ALTER TABLE public.assistant_requests 
ADD COLUMN IF NOT EXISTS assigned_at timestamptz;

-- Add response_deadline column (defaults to 2 hours after assignment)
ALTER TABLE public.assistant_requests 
ADD COLUMN IF NOT EXISTS response_deadline_hours integer DEFAULT 2;

-- Create index for finding expired assignments
CREATE INDEX IF NOT EXISTS idx_assistant_requests_assigned_at ON public.assistant_requests(assigned_at) 
WHERE status = 'assigned' AND accepted_at IS NULL;