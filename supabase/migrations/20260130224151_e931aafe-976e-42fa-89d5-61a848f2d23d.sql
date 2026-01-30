-- Add go_live_date column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN go_live_date DATE;

-- Index for filtering/sorting by go-live date
CREATE INDEX idx_organizations_go_live ON public.organizations(go_live_date);

COMMENT ON COLUMN public.organizations.go_live_date IS 'Scheduled date when final import completes and the organization begins live operations';