-- Drop the old constraint and add the new one with all 6 positions
ALTER TABLE public.organization_kiosk_settings 
DROP CONSTRAINT location_badge_position_check;

ALTER TABLE public.organization_kiosk_settings 
ADD CONSTRAINT location_badge_position_check 
CHECK (location_badge_position = ANY (ARRAY['top-left'::text, 'top-center'::text, 'top-right'::text, 'bottom-left'::text, 'bottom-center'::text, 'bottom-right'::text]));