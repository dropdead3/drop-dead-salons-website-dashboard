-- Add glow effects toggle to kiosk settings
ALTER TABLE organization_kiosk_settings 
ADD COLUMN enable_glow_effects boolean DEFAULT false;