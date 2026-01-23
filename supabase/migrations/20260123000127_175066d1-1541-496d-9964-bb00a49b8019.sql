-- Phase 0: Database Foundation for Phorest Booking Calendar (Fixed)

-- 1. Add phorest_branch_id to locations table for mapping
ALTER TABLE locations ADD COLUMN IF NOT EXISTS phorest_branch_id TEXT;

-- 2. Create calendar_preferences table for user view settings
-- Note: default_location_id references locations(id) which is TEXT
CREATE TABLE IF NOT EXISTS calendar_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES employee_profiles(user_id) ON DELETE CASCADE UNIQUE NOT NULL,
  default_view TEXT DEFAULT 'week' CHECK (default_view IN ('day', 'week', 'month', 'agenda')),
  default_location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  show_cancelled BOOLEAN DEFAULT false,
  color_by TEXT DEFAULT 'status' CHECK (color_by IN ('status', 'service', 'stylist')),
  hours_start INTEGER DEFAULT 8 CHECK (hours_start >= 0 AND hours_start <= 23),
  hours_end INTEGER DEFAULT 20 CHECK (hours_end >= 1 AND hours_end <= 24),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on calendar_preferences
ALTER TABLE calendar_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view and manage their own preferences
CREATE POLICY "Users can view own preferences"
ON calendar_preferences FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
ON calendar_preferences FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
ON calendar_preferences FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 3. Add calendar permissions
INSERT INTO permissions (name, display_name, description, category) VALUES
  ('view_booking_calendar', 'View Booking Calendar', 'Access the main Phorest booking calendar', 'Scheduling'),
  ('view_own_appointments', 'View Own Appointments', 'See only your own scheduled appointments', 'Scheduling'),
  ('view_team_appointments', 'View Team Appointments', 'See all staff appointments at assigned locations', 'Scheduling'),
  ('view_all_locations_calendar', 'View All Locations', 'See appointments across all salon locations', 'Scheduling'),
  ('create_appointments', 'Create Appointments', 'Book new appointments via Phorest', 'Scheduling'),
  ('add_appointment_notes', 'Add Appointment Notes', 'Add internal staff notes to appointments', 'Scheduling')
ON CONFLICT (name) DO NOTHING;

-- 4. Set default permissions for roles
-- Stylist: view_booking_calendar, view_own_appointments
INSERT INTO role_permissions (role, permission_id)
SELECT 'stylist', id FROM permissions WHERE name IN ('view_booking_calendar', 'view_own_appointments')
ON CONFLICT DO NOTHING;

-- Receptionist: view_booking_calendar, view_team_appointments, view_all_locations_calendar, create_appointments
INSERT INTO role_permissions (role, permission_id)
SELECT 'receptionist', id FROM permissions WHERE name IN ('view_booking_calendar', 'view_team_appointments', 'view_all_locations_calendar', 'create_appointments')
ON CONFLICT DO NOTHING;

-- Manager: All calendar permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'manager', id FROM permissions WHERE name IN ('view_booking_calendar', 'view_own_appointments', 'view_team_appointments', 'view_all_locations_calendar', 'create_appointments', 'add_appointment_notes')
ON CONFLICT DO NOTHING;

-- Admin: All calendar permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions WHERE name IN ('view_booking_calendar', 'view_own_appointments', 'view_team_appointments', 'view_all_locations_calendar', 'create_appointments', 'add_appointment_notes')
ON CONFLICT DO NOTHING;

-- 5. Create trigger for updating timestamps on calendar_preferences
CREATE TRIGGER update_calendar_preferences_updated_at
BEFORE UPDATE ON calendar_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();