-- Add birthday column to employee_profiles
ALTER TABLE public.employee_profiles
ADD COLUMN birthday date;