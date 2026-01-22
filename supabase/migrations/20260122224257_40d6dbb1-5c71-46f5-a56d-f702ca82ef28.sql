-- Add hide_numbers preference to employee_profiles
ALTER TABLE public.employee_profiles
ADD COLUMN hide_numbers boolean NOT NULL DEFAULT false;