-- Add structured hours and holiday closures to locations
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS hours_json JSONB DEFAULT '{
  "monday": {"closed": true},
  "tuesday": {"open": "10:00", "close": "18:00"},
  "wednesday": {"open": "10:00", "close": "18:00"},
  "thursday": {"open": "10:00", "close": "18:00"},
  "friday": {"open": "10:00", "close": "18:00"},
  "saturday": {"open": "10:00", "close": "18:00"},
  "sunday": {"closed": true}
}'::jsonb;

ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS holiday_closures JSONB DEFAULT '[]'::jsonb;

-- Update existing locations with structured hours
UPDATE public.locations 
SET hours_json = '{
  "monday": {"closed": true},
  "tuesday": {"open": "10:00", "close": "18:00"},
  "wednesday": {"open": "10:00", "close": "18:00"},
  "thursday": {"open": "10:00", "close": "18:00"},
  "friday": {"open": "10:00", "close": "18:00"},
  "saturday": {"open": "10:00", "close": "18:00"},
  "sunday": {"closed": true}
}'::jsonb
WHERE hours_json IS NULL;