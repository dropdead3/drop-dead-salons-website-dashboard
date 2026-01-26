-- Create report_history table for tracking generated reports
CREATE TABLE report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  report_name TEXT NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  parameters JSONB DEFAULT '{}',
  generated_by UUID REFERENCES employee_profiles(user_id) ON DELETE SET NULL,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_report_history_type ON report_history(report_type);
CREATE INDEX idx_report_history_date ON report_history(created_at DESC);
CREATE INDEX idx_report_history_user ON report_history(generated_by);

-- Enable RLS
ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reports they generated or if they have view_reports permission
CREATE POLICY "Users can view own reports"
  ON report_history FOR SELECT
  TO authenticated
  USING (
    generated_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- Policy: Users can create reports
CREATE POLICY "Authenticated users can create reports"
  ON report_history FOR INSERT
  TO authenticated
  WITH CHECK (generated_by = auth.uid());

-- Policy: Admins can delete reports
CREATE POLICY "Admins can delete reports"
  ON report_history FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );