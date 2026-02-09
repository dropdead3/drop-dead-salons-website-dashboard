-- Add display orientation field to kiosk settings
ALTER TABLE public.organization_kiosk_settings 
ADD COLUMN IF NOT EXISTS display_orientation text NOT NULL DEFAULT 'portrait' 
CHECK (display_orientation IN ('portrait', 'landscape'));