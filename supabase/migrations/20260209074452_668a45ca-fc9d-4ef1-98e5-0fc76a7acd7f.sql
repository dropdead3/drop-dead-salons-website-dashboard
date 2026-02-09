-- Update CHECK constraint to include center badge positions
ALTER TABLE organization_kiosk_settings 
DROP CONSTRAINT IF EXISTS organization_kiosk_settings_location_badge_position_check;

ALTER TABLE organization_kiosk_settings 
ADD CONSTRAINT organization_kiosk_settings_location_badge_position_check 
CHECK (location_badge_position IN (
  'top-left', 'top-center', 'top-right', 
  'bottom-left', 'bottom-center', 'bottom-right'
));