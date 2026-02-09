-- Add logo_color column for color overlay on kiosk logo
ALTER TABLE public.organization_kiosk_settings
ADD COLUMN logo_color text DEFAULT NULL;