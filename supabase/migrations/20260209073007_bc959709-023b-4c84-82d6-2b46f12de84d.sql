-- Add location badge configuration columns to organization_kiosk_settings
ALTER TABLE organization_kiosk_settings 
ADD COLUMN IF NOT EXISTS show_location_badge boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS location_badge_position text DEFAULT 'bottom-left',
ADD COLUMN IF NOT EXISTS location_badge_style text DEFAULT 'glass';

-- Add constraints for valid values
ALTER TABLE organization_kiosk_settings 
ADD CONSTRAINT location_badge_position_check 
CHECK (location_badge_position IN ('top-left', 'top-right', 'bottom-left', 'bottom-right'));

ALTER TABLE organization_kiosk_settings 
ADD CONSTRAINT location_badge_style_check 
CHECK (location_badge_style IN ('glass', 'solid', 'outline'));