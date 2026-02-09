-- Add logo size field to kiosk settings
ALTER TABLE public.organization_kiosk_settings 
ADD COLUMN IF NOT EXISTS logo_size text NOT NULL DEFAULT 'md' 
CHECK (logo_size IN ('xs', 'sm', 'md', 'lg', 'xl'));