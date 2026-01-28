-- Add location_id column to announcements table for location-specific announcements
-- NULL = Company-wide announcement (visible to all users)
-- text value = Location-specific announcement (visible only to users at that location)
-- Note: locations.id is text type, not uuid

ALTER TABLE public.announcements 
ADD COLUMN location_id text REFERENCES public.locations(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.announcements.location_id IS 
  'NULL for company-wide announcements; set to a location ID to restrict visibility';

-- Create an index for efficient location-based queries
CREATE INDEX idx_announcements_location_id ON public.announcements(location_id);