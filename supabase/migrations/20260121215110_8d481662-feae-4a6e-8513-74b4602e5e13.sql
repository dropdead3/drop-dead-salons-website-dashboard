-- Add homepage_order column for custom ordering
ALTER TABLE public.employee_profiles 
ADD COLUMN homepage_order INTEGER DEFAULT NULL;

-- Create index for efficient ordering
CREATE INDEX idx_employee_profiles_homepage_order 
ON public.employee_profiles (homepage_order) 
WHERE homepage_visible = true;