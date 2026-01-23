-- Phase 0 continued: Add remaining tables

-- 1. Create phorest_services table for service sync
CREATE TABLE IF NOT EXISTS phorest_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phorest_service_id TEXT UNIQUE NOT NULL,
  phorest_branch_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price NUMERIC(10,2),
  requires_qualification BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for branch lookups
CREATE INDEX IF NOT EXISTS idx_phorest_services_branch ON phorest_services(phorest_branch_id);

-- Enable RLS on phorest_services
ALTER TABLE phorest_services ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view active services
CREATE POLICY "Authenticated users can view active services"
ON phorest_services FOR SELECT
TO authenticated
USING (is_active = true);

-- Policy: Admins can manage services (insert/update/delete)
CREATE POLICY "Admins can insert services"
ON phorest_services FOR INSERT
TO authenticated
WITH CHECK (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Admins can update services"
ON phorest_services FOR UPDATE
TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

CREATE POLICY "Admins can delete services"
ON phorest_services FOR DELETE
TO authenticated
USING (public.is_coach_or_admin(auth.uid()));

-- 2. Create appointment_notes table for internal staff notes
CREATE TABLE IF NOT EXISTS appointment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phorest_appointment_id TEXT NOT NULL,
  author_id UUID REFERENCES employee_profiles(user_id) NOT NULL,
  note TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_appointment_notes_phorest_id ON appointment_notes(phorest_appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_notes_author ON appointment_notes(author_id);

-- Enable RLS on appointment_notes
ALTER TABLE appointment_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view public notes and their own private notes
CREATE POLICY "Users can view notes"
ON appointment_notes FOR SELECT
TO authenticated
USING (
  is_private = false 
  OR author_id = auth.uid()
);

-- Policy: Users can create notes
CREATE POLICY "Users can create notes"
ON appointment_notes FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

-- Policy: Users can update their own notes
CREATE POLICY "Users can update own notes"
ON appointment_notes FOR UPDATE
TO authenticated
USING (author_id = auth.uid());

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete own notes"
ON appointment_notes FOR DELETE
TO authenticated
USING (author_id = auth.uid());

-- 3. Create trigger for updating timestamps on phorest_services
CREATE TRIGGER update_phorest_services_updated_at
BEFORE UPDATE ON phorest_services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();