-- Add chat_enabled column to employee_profiles
ALTER TABLE public.employee_profiles 
ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT true;