-- Add preferred social handle field to employee_profiles
ALTER TABLE public.employee_profiles
ADD COLUMN preferred_social_handle TEXT DEFAULT 'instagram' CHECK (preferred_social_handle IN ('instagram', 'tiktok'));