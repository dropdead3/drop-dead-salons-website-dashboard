-- Add location_ids array to support multiple locations
ALTER TABLE public.employee_profiles 
ADD COLUMN IF NOT EXISTS location_ids TEXT[] DEFAULT '{}';