-- Add tiktok handle column to employee_profiles
ALTER TABLE public.employee_profiles 
ADD COLUMN IF NOT EXISTS tiktok text;