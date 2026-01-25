-- Add planned departure fields to employee_profiles
ALTER TABLE employee_profiles
ADD COLUMN IF NOT EXISTS planned_departure_date date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS departure_notes text DEFAULT NULL;

-- Create staffing_history table for trend tracking
CREATE TABLE IF NOT EXISTS staffing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id text REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  record_date date NOT NULL DEFAULT CURRENT_DATE,
  stylist_count integer NOT NULL DEFAULT 0,
  assistant_count integer NOT NULL DEFAULT 0,
  stylist_capacity integer DEFAULT NULL,
  assistant_ratio numeric(3,2) DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(location_id, record_date)
);

-- Enable RLS on staffing_history
ALTER TABLE staffing_history ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read staffing history
CREATE POLICY "Authenticated users can read staffing history"
ON staffing_history FOR SELECT TO authenticated USING (true);

-- Service role can manage staffing history (for edge functions)
CREATE POLICY "Service role can manage staffing history"
ON staffing_history FOR ALL USING (true);

-- Insert staffing alert threshold setting if not exists
INSERT INTO site_settings (id, value, updated_at)
VALUES (
  'staffing_alert_threshold',
  '{"percentage": 70, "email_enabled": true, "in_app_enabled": true}'::jsonb,
  now()
)
ON CONFLICT (id) DO NOTHING;