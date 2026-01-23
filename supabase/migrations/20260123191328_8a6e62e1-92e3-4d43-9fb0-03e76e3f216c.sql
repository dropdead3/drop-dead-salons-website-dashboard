-- Add show_on_calendar column to control calendar visibility
ALTER TABLE phorest_staff_mapping 
ADD COLUMN show_on_calendar boolean DEFAULT true;

-- Set sensible defaults: Only show users with a stylist_level as true
UPDATE phorest_staff_mapping psm
SET show_on_calendar = (
  SELECT ep.stylist_level IS NOT NULL 
  FROM employee_profiles ep 
  WHERE ep.user_id = psm.user_id
);