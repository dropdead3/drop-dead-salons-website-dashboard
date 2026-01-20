-- Add response time tracking to assistant_requests
ALTER TABLE public.assistant_requests 
ADD COLUMN IF NOT EXISTS response_time_seconds integer;

-- Add a comment explaining the column
COMMENT ON COLUMN public.assistant_requests.response_time_seconds IS 'Seconds between assignment and accept/decline response';

-- Create a function to calculate response time when accepted_at is set
CREATE OR REPLACE FUNCTION public.calculate_response_time()
RETURNS TRIGGER AS $$
BEGIN
    -- When accepted_at is set, calculate response time from assigned_at
    IF NEW.accepted_at IS NOT NULL AND OLD.accepted_at IS NULL AND NEW.assigned_at IS NOT NULL THEN
        NEW.response_time_seconds := EXTRACT(EPOCH FROM (NEW.accepted_at::timestamp - NEW.assigned_at::timestamp))::integer;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-calculate response time
DROP TRIGGER IF EXISTS trg_calculate_response_time ON public.assistant_requests;
CREATE TRIGGER trg_calculate_response_time
    BEFORE UPDATE ON public.assistant_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_response_time();