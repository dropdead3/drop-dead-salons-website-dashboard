-- Add Drop Dead Certified field for extension training certification
ALTER TABLE public.employee_profiles 
ADD COLUMN IF NOT EXISTS dd_certified BOOLEAN DEFAULT false;