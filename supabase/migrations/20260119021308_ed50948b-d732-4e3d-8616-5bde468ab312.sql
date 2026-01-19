-- Add bio column to employee_profiles table for stylist card flip content
ALTER TABLE public.employee_profiles 
ADD COLUMN bio TEXT;