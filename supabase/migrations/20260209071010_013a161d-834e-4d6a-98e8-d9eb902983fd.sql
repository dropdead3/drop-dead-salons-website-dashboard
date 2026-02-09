-- Add background overlay opacity column for luxury glass UI
ALTER TABLE organization_kiosk_settings 
ADD COLUMN IF NOT EXISTS background_overlay_opacity numeric(3,2) DEFAULT 0.5;