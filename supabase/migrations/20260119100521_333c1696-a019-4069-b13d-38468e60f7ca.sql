-- Add work_days column to employee_profiles
-- Stores array of day abbreviations: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
ALTER TABLE public.employee_profiles 
ADD COLUMN IF NOT EXISTS work_days text[] DEFAULT '{}'::text[];