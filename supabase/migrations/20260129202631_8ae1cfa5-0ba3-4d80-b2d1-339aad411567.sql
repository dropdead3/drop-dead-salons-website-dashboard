-- Create default organization for existing salon data
INSERT INTO organizations (name, slug, status, onboarding_stage, timezone)
VALUES ('Drop Dead Gorgeous', 'drop-dead-gorgeous', 'active', 'live', 'America/Chicago')
ON CONFLICT (slug) DO NOTHING;

-- Update all existing records with the default organization
DO $$
DECLARE
  default_org_id uuid;
BEGIN
  SELECT id INTO default_org_id FROM organizations WHERE slug = 'drop-dead-gorgeous';
  
  -- Update locations
  UPDATE locations SET organization_id = default_org_id 
  WHERE organization_id IS NULL;
  
  -- Update employee_profiles
  UPDATE employee_profiles SET organization_id = default_org_id 
  WHERE organization_id IS NULL;
  
  -- Update clients
  UPDATE clients SET organization_id = default_org_id 
  WHERE organization_id IS NULL;
  
  -- Update appointments
  UPDATE appointments SET organization_id = default_org_id 
  WHERE organization_id IS NULL;
  
  -- Update services
  UPDATE services SET organization_id = default_org_id 
  WHERE organization_id IS NULL;
END $$;