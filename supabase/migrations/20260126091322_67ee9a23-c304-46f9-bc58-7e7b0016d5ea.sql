-- Add capacity timing configuration columns to locations table
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS break_minutes_per_day integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS lunch_minutes integer DEFAULT 45,
ADD COLUMN IF NOT EXISTS appointment_padding_minutes integer DEFAULT 10;

-- Add helpful comments
COMMENT ON COLUMN public.locations.break_minutes_per_day IS 'Total break time per stylist per day in minutes (e.g., two 15-min breaks = 30)';
COMMENT ON COLUMN public.locations.lunch_minutes IS 'Lunch duration per stylist per day in minutes';
COMMENT ON COLUMN public.locations.appointment_padding_minutes IS 'Buffer time between appointments in minutes for cleanup/prep';