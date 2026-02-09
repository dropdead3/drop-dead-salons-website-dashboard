-- Clean up duplicate org-level rows (keep most recent)
DELETE FROM organization_kiosk_settings a
USING organization_kiosk_settings b
WHERE a.organization_id = b.organization_id
  AND a.location_id IS NULL
  AND b.location_id IS NULL
  AND a.updated_at < b.updated_at;

-- Add unique constraint on (organization_id, location_id) with NULL handling
CREATE UNIQUE INDEX IF NOT EXISTS organization_kiosk_settings_org_loc_unique 
ON organization_kiosk_settings (organization_id, COALESCE(location_id, '___NULL___'));