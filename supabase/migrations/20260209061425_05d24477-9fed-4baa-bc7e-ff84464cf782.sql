-- Allow kiosk screens to read settings for their location (unauthenticated access)
CREATE POLICY "Kiosk can read settings by location" 
ON organization_kiosk_settings
FOR SELECT
USING (
  -- Allow if there's an active location for this organization
  EXISTS (
    SELECT 1 FROM locations l
    WHERE l.organization_id = organization_kiosk_settings.organization_id
    AND l.is_active = true
  )
);