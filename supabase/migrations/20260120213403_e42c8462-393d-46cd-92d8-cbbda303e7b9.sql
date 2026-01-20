-- Add accepted_at column to track when assistant accepted
ALTER TABLE public.assistant_requests 
ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS declined_by uuid[] DEFAULT '{}';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assistant_requests_accepted ON public.assistant_requests(accepted_at) WHERE accepted_at IS NOT NULL;