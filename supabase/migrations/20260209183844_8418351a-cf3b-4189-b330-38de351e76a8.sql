
-- Add rental model configuration to locations
ALTER TABLE public.locations 
  ADD COLUMN rental_model text NOT NULL DEFAULT 'monthly' 
    CHECK (rental_model IN ('monthly', 'weekly', 'daily')),
  ADD COLUMN booth_assignment_enabled boolean NOT NULL DEFAULT true;

-- Add a daily_rate column to rental_stations for daily model pricing
ALTER TABLE public.rental_stations 
  ADD COLUMN daily_rate numeric;

COMMENT ON COLUMN public.locations.rental_model IS 'How this location rents booths: monthly, weekly, or daily';
COMMENT ON COLUMN public.locations.booth_assignment_enabled IS 'Whether renters are assigned specific booths/stations';
