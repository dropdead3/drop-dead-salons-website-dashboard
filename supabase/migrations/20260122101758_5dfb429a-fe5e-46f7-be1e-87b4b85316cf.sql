-- Add major_crossroads field to locations table for receptionist reference
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS major_crossroads TEXT;