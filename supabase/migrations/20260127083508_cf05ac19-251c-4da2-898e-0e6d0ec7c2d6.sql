-- Add same-day booking restriction columns to phorest_services
ALTER TABLE phorest_services
ADD COLUMN IF NOT EXISTS allow_same_day_booking BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS same_day_restriction_reason TEXT;