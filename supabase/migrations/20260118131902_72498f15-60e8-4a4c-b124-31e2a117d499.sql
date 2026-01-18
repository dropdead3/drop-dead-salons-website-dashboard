-- Add columns for homepage visibility feature
ALTER TABLE public.employee_profiles 
ADD COLUMN IF NOT EXISTS homepage_visible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS homepage_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS homepage_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_booking BOOLEAN DEFAULT true;

-- Create index for quick homepage queries
CREATE INDEX IF NOT EXISTS idx_employee_profiles_homepage 
ON public.employee_profiles (homepage_visible, is_active, location_id) 
WHERE homepage_visible = true AND is_active = true;